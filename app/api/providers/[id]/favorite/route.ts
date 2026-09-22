

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
} from "@/app/lib/security/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RATE_MAX = 30; 

// À AJOUTER dans app/api/providers/[id]/favorite/route.ts, en plus de POST et DELETE existants
// (garde "guard" et les imports existants tels quels)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guardResult = await guard(req);
    if ("error" in guardResult) return guardResult.error;
    const { session, limit } = guardResult;

    const { id: providerId } = await params;

    const existing = await prisma.favorite.findUnique({
      where: {
        clientId_providerId: {
          clientId: session.user.id,
          providerId,
        },
      },
      select: { id: true },
    });

    return NextResponse.json(
      { favorite: !!existing },
      { headers: rateLimitHeaders(RATE_MAX, limit) }
    );
  } catch (error) {
    console.error("[api/providers/favorite] GET error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
async function guard(req: NextRequest) {

  const ip = getClientIp(req.headers);
  const limit = checkRateLimit(`favorite:${ip}`, RATE_MAX);

  if (!limit.allowed) {
    return {
      error: NextResponse.json(
        { error: "Trop de requêtes. Réessayez plus tard." },
        { status: 429, headers: rateLimitHeaders(RATE_MAX, limit) }
      ),
    } as const;
  }


  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: "Non authentifié" },
        { status: 401, headers: rateLimitHeaders(RATE_MAX, limit) }
      ),
    } as const;
  }

  return { session, limit } as const;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guardResult = await guard(req);
    if ("error" in guardResult) return guardResult.error;
    const { session, limit } = guardResult;

    const { id: providerId } = await params;

    if (session.user.id === providerId) {
      return NextResponse.json(
        { error: "Impossible de se mettre en favori" },
        { status: 400, headers: rateLimitHeaders(RATE_MAX, limit) }
      );
    }

  
    const target = await prisma.user.findFirst({
      where: {
        id: providerId,
        accountType: "PROVIDER",
        isActive: true,
      },
      select: { id: true },
    });

    if (!target) {
      return NextResponse.json(
        { error: "Prestataire introuvable" },
        { status: 404, headers: rateLimitHeaders(RATE_MAX, limit) }
      );
    }

    
    await prisma.favorite.upsert({
      where: {
        clientId_providerId: {
          clientId: session.user.id,
          providerId,
        },
      },
      create: {
        clientId: session.user.id,
        providerId,
      },
      update: {},
    });

    return NextResponse.json(
      { ok: true, favorite: true },
      { headers: rateLimitHeaders(RATE_MAX, limit) }
    );
  } catch (error) {
    console.error("[api/providers/favorite] POST error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guardResult = await guard(req);
    if ("error" in guardResult) return guardResult.error;
    const { session, limit } = guardResult;

    const { id: providerId } = await params;

    await prisma.favorite
      .delete({
        where: {
          clientId_providerId: {
            clientId: session.user.id,
            providerId,
          },
        },
      })
      .catch(() => null);

    return NextResponse.json(
      { ok: true, favorite: false },
      { headers: rateLimitHeaders(RATE_MAX, limit) }
    );
  } catch (error) {
    console.error("[api/providers/favorite] DELETE error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}