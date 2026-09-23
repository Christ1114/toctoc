

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseVideoUrl } from "@/app/lib/security/url-validation";
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
} from "@/app/lib/security/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RATE_MAX = 20; 
const MAX_VIDEOS_PER_PROVIDER = 20;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;


export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const limit = await checkRateLimit(`my-videos-get:${ip}`, 60);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes" },
        { status: 429, headers: rateLimitHeaders(60, limit) }
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const videos = await prisma.providerVideo.findMany({
      where: { providerId: session.user.id },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        url: true,
        platform: true,
        externalId: true,
        thumbnail: true,
        title: true,
        description: true,
        duration: true,
        position: true,
        isVisible: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ videos }, { headers: rateLimitHeaders(60, limit) });
  } catch (error) {
    console.error("[api/providers/me/videos] GET error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
  
    const ip = getClientIp(req.headers);
    const limit = await checkRateLimit(`my-videos-post:${ip}`, RATE_MAX);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez plus tard." },
        { status: 429, headers: rateLimitHeaders(RATE_MAX, limit) }
      );
    }


    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401, headers: rateLimitHeaders(RATE_MAX, limit) }
      );
    }

   
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { accountType: true, isActive: true },
    });

    if (!me || me.accountType !== "PROVIDER") {
      return NextResponse.json(
        { error: "Réservé aux prestataires" },
        { status: 403, headers: rateLimitHeaders(RATE_MAX, limit) }
      );
    }

    if (!me.isActive) {
      return NextResponse.json(
        { error: "Compte désactivé" },
        { status: 403, headers: rateLimitHeaders(RATE_MAX, limit) }
      );
    }

   
    const count = await prisma.providerVideo.count({
      where: { providerId: session.user.id },
    });

    if (count >= MAX_VIDEOS_PER_PROVIDER) {
      return NextResponse.json(
        { error: `Limite de ${MAX_VIDEOS_PER_PROVIDER} vidéos atteinte` },
        { status: 400, headers: rateLimitHeaders(RATE_MAX, limit) }
      );
    }
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "JSON invalide" },
        { status: 400, headers: rateLimitHeaders(RATE_MAX, limit) }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as any).url !== "string"
    ) {
      return NextResponse.json(
        { error: "Champ 'url' requis" },
        { status: 400, headers: rateLimitHeaders(RATE_MAX, limit) }
      );
    }

    const { url, title, description } = body as {
      url: string;
      title?: unknown;
      description?: unknown;
    };

    const parsed = parseVideoUrl(url);

    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.reason },
        { status: 400, headers: rateLimitHeaders(RATE_MAX, limit) }
      );
    }
    const safeTitle =
      typeof title === "string"
        ? title.trim().slice(0, MAX_TITLE_LENGTH) || null
        : null;

    const safeDescription =
      typeof description === "string"
        ? description.trim().slice(0, MAX_DESCRIPTION_LENGTH) || null
        : null;
    const lastVideo = await prisma.providerVideo.findFirst({
      where: { providerId: session.user.id },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const nextPosition = (lastVideo?.position ?? -1) + 1;
    const video = await prisma.providerVideo.create({
      data: {
        providerId: session.user.id,
        url,
        platform: parsed.platform,
        externalId: parsed.externalId,
        thumbnail: parsed.thumbnail,
        title: safeTitle,
        description: safeDescription,
        position: nextPosition,
        isVisible: true,
      },
      select: {
        id: true,
        url: true,
        platform: true,
        externalId: true,
        thumbnail: true,
        title: true,
        description: true,
        position: true,
        isVisible: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { ok: true, video },
      { status: 201, headers: rateLimitHeaders(RATE_MAX, limit) }
    );
  } catch (error) {
    console.error("[api/providers/me/videos] POST error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}