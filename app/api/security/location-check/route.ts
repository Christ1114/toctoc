
import { NextRequest, NextResponse } from "next/server";
import { validateLocation, validateLocationWithMinimumDistance } from "@/app/lib/security/locationCheck";
import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";


const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 10;


setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.timestamp > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export async function POST(req: NextRequest) {
  try {
    
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" }, 
        { status: 401 }
      );
    }

    
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    const referer = req.headers.get("referer");

    if (origin && host && new URL(origin).host !== host) {
      return NextResponse.json(
        { success: false, error: "Origine non autorisée" }, 
        { status: 403 }
      );
    }

   
    if (!origin && referer && host) {
      const refererHost = new URL(referer).host;
      if (refererHost !== host) {
        return NextResponse.json(
          { success: false, error: "Origine non autorisée" }, 
          { status: 403 }
        );
      }
    }

    
    const internalHeader = req.headers.get("x-internal-request");
    if (process.env.INTERNAL_REQUEST_SECRET && 
        internalHeader !== process.env.INTERNAL_REQUEST_SECRET) {
      return NextResponse.json(
        { success: false, error: "Requête non autorisée" }, 
        { status: 403 }
      );
    }

 
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

   
    const body = await req.json().catch(() => null);

    if (!body || typeof body.lat !== "number" || typeof body.lng !== "number") {
      return NextResponse.json(
        { success: false, isValid: false, reason: "payload-invalide" }, 
        { status: 400 }
      );
    }
    if (
      !Number.isFinite(body.lat) ||
      !Number.isFinite(body.lng) ||
      body.lat < -90 ||
      body.lat > 90 ||
      body.lng < -180 ||
      body.lng > 180
    ) {
      return NextResponse.json(
        { success: false, isValid: false, reason: "coordonnees-invalides" }, 
        { status: 400 }
      );
    }

  
    const result = validateLocation(body.lat, body.lng, {
      usePolygon: true,        // Utiliser le polygone précis
      checkRegion: true,       // Vérifier la région
      toleranceKm: 5,          // 5km de tolérance
    });

    const resultWithDistance = result.isValid 
      ? validateLocationWithMinimumDistance(body.lat, body.lng, 5)
      : result;

  
    console.log("[LOCATION_CHECK]", {
      userId: session.user.id,
      lat: body.lat,
      lng: body.lng,
      isValid: resultWithDistance.isValid,
      reason: resultWithDistance.reason,
      region: resultWithDistance.region,
      distanceToBorder: resultWithDistance.distanceToBorder,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        ...resultWithDistance,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        },
      }
    );

  } catch (error) {
    console.error("Erreur validate-location:", error);
    
    const errorMessage = process.env.NODE_ENV === "production" 
      ? "Erreur interne" 
      : error instanceof Error ? error.message : "Erreur interne";

    return NextResponse.json(
      { success: false, error: errorMessage }, 
      { status: 500 }
    );
  }
}


function checkRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
} {
  const now = Date.now();
  const userRate = rateLimitMap.get(userId);

  if (!userRate) {
    rateLimitMap.set(userId, { count: 1, timestamp: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, retryAfter: 0 };
  }

  if (now - userRate.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(userId, { count: 1, timestamp: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, retryAfter: 0 };
  }

  if (userRate.count >= RATE_LIMIT_MAX) {
    const retryAfter = RATE_LIMIT_WINDOW - (now - userRate.timestamp);
    return { 
      allowed: false, 
      remaining: 0, 
      retryAfter: Math.max(0, retryAfter)
    };
  }

  userRate.count++;
  return { 
    allowed: true, 
    remaining: RATE_LIMIT_MAX - userRate.count,
    retryAfter: 0
  };
}