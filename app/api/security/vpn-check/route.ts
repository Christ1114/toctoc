// app/api/check-vpn/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkVpnStatus } from "@/app/lib/security/vpnCheck";
import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";

// Rate limiting avec nettoyage automatique
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requêtes par minute

// Nettoyer les entrées expirées toutes les 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.timestamp > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export async function GET(req: NextRequest) {
  try {
    // 1. Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { 
          success: false,
          error: "Non authentifié" 
        }, 
        { status: 401 }
      );
    }

    // 2. Vérifier l'origine de la requête (CSRF protection)
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    const referer = req.headers.get("referer");

    // Vérifier l'origine si elle existe
    if (origin && host && new URL(origin).host !== host) {
      return NextResponse.json(
        { 
          success: false,
          error: "Origine non autorisée" 
        }, 
        { status: 403 }
      );
    }

    // Vérifier le referer si l'origine n'est pas disponible
    if (!origin && referer && host) {
      const refererHost = new URL(referer).host;
      if (refererHost !== host) {
        return NextResponse.json(
          { 
            success: false,
            error: "Origine non autorisée" 
          }, 
          { status: 403 }
        );
      }
    }

    // 3. Vérifier le header personnalisé (si configuré)
    const internalHeader = req.headers.get("x-internal-request");
    if (process.env.INTERNAL_REQUEST_SECRET && 
        internalHeader !== process.env.INTERNAL_REQUEST_SECRET) {
      return NextResponse.json(
        { 
          success: false,
          error: "Requête non autorisée" 
        }, 
        { status: 403 }
      );
    }

    // 4. Rate limiting
    const userId = session.user.id;
    const rateLimitResult = checkRateLimit(userId);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          success: false,
          error: "Trop de requêtes. Veuillez réessayer plus tard." 
        }, 
        { 
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimitResult.retryAfter / 1000)),
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          }
        }
      );
    }

    // 5. Exécuter la vérification VPN
    const vpnResult = await checkVpnStatus(req.headers);

    // 6. Journaliser le résultat
    console.log("VPN Check:", {
      userId,
      isVpn: vpnResult.isVpn,
      provider: vpnResult.provider,
      country: vpnResult.country,
      confidence: vpnResult.confidence,
      timestamp: new Date().toISOString(),
    });

    // 7. Retourner le résultat avec les headers de rate limiting
    return NextResponse.json(
      {
        success: true,
        ...vpnResult,
      },
      {
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );

  } catch (error) {
    console.error("Erreur check-vpn:", error);
    
    // Ne pas exposer les détails de l'erreur en production
    const errorMessage = process.env.NODE_ENV === "production" 
      ? "Erreur interne" 
      : error instanceof Error ? error.message : "Erreur interne";

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      }, 
      { status: 500 }
    );
  }
}

// Fonction de rate limiting améliorée
function checkRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
} {
  const now = Date.now();
  const userRate = rateLimitMap.get(userId);

  // Si l'utilisateur n'a pas encore fait de requête
  if (!userRate) {
    rateLimitMap.set(userId, { count: 1, timestamp: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, retryAfter: 0 };
  }

  // Si la fenêtre est expirée, réinitialiser
  if (now - userRate.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(userId, { count: 1, timestamp: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, retryAfter: 0 };
  }

  // Si le nombre maximum est atteint
  if (userRate.count >= RATE_LIMIT_MAX) {
    const retryAfter = RATE_LIMIT_WINDOW - (now - userRate.timestamp);
    return { 
      allowed: false, 
      remaining: 0, 
      retryAfter: Math.max(0, retryAfter)
    };
  }

  // Incrémenter le compteur
  userRate.count++;
  return { 
    allowed: true, 
    remaining: RATE_LIMIT_MAX - userRate.count,
    retryAfter: 0
  };
}

// Optionnel : Méthode HEAD pour les health checks
export async function HEAD(req: NextRequest) {
  return NextResponse.json(
    { status: "ok" },
    { status: 200 }
  );
}