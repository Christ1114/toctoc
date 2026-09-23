// app/api/providers/me/videos/[videoId]/route.ts

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
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;

type RouteParams = { params: Promise<{ videoId: string }> };


async function guard(req: NextRequest, videoId: string) {

  const ip = getClientIp(req.headers);
  const limit = await checkRateLimit(`my-video:${ip}`, RATE_MAX);

  if (!limit.allowed) {
    return {
      error: NextResponse.json(
        { error: "Trop de requêtes" },
        { status: 429, headers: rateLimitHeaders(RATE_MAX, limit) }
      ),
    } as const;
  }

  // 2. Auth
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: "Non authentifié" },
        { status: 401, headers: rateLimitHeaders(RATE_MAX, limit) }
      ),
    } as const;
  }

  // 3. Récupère la vidéo et vérifie la propriété
  const video = await prisma.providerVideo.findUnique({
    where: { id: videoId },
    select: { id: true, providerId: true },
  });

  if (!video) {
    return {
      error: NextResponse.json(
        { error: "Vidéo introuvable" },
        { status: 404, headers: rateLimitHeaders(RATE_MAX, limit) }
      ),
    } as const;
  }

  // ⚠️ Empêche un user de modifier/supprimer la vidéo d'un autre
  if (video.providerId !== session.user.id) {
    return {
      error: NextResponse.json(
        { error: "Non autorisé" },
        { status: 403, headers: rateLimitHeaders(RATE_MAX, limit) }
      ),
    } as const;
  }

  return { session, video, limit } as const;
}

// ─── PATCH : modifier titre / description / visibilité ───
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { videoId } = await params;

    if (!videoId || typeof videoId !== "string" || videoId.length > 64) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const guardResult = await guard(req, videoId);
    if ("error" in guardResult) return guardResult.error;
    const { session, limit } = guardResult;

    // Parse body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "JSON invalide" },
        { status: 400, headers: rateLimitHeaders(RATE_MAX, limit) }
      );
    }

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Corps invalide" },
        { status: 400, headers: rateLimitHeaders(RATE_MAX, limit) }
      );
    }

    // Whitelist stricte : seuls ces champs sont modifiables
    const { title, description, isVisible, position } = body as {
      title?: unknown;
      description?: unknown;
      isVisible?: unknown;
      position?: unknown;
    };

    const updateData: {
      title?: string | null;
      description?: string | null;
      isVisible?: boolean;
      position?: number;
    } = {};

    if (title !== undefined) {
      if (title !== null && typeof title !== "string") {
        return NextResponse.json(
          { error: "'title' doit être une chaîne ou null" },
          { status: 400, headers: rateLimitHeaders(RATE_MAX, limit) }
        );
      }
      updateData.title =
        typeof title === "string"
          ? title.trim().slice(0, MAX_TITLE_LENGTH) || null
          : null;
    }

    if (description !== undefined) {
      if (description !== null && typeof description !== "string") {
        return NextResponse.json(
          { error: "'description' doit être une chaîne ou null" },
          { status: 400, headers: rateLimitHeaders(RATE_MAX, limit) }
        );
      }
      updateData.description =
        typeof description === "string"
          ? description.trim().slice(0, MAX_DESCRIPTION_LENGTH) || null
          : null;
    }

    if (isVisible !== undefined) {
      if (typeof isVisible !== "boolean") {
        return NextResponse.json(
          { error: "'isVisible' doit être un booléen" },
          { status: 400, headers: rateLimitHeaders(RATE_MAX, limit) }
        );
      }
      updateData.isVisible = isVisible;
    }

    if (position !== undefined) {
      if (
        typeof position !== "number" ||
        !Number.isInteger(position) ||
        position < 0 ||
        position > 1000
      ) {
        return NextResponse.json(
          { error: "'position' doit être un entier entre 0 et 1000" },
          { status: 400, headers: rateLimitHeaders(RATE_MAX, limit) }
        );
      }
      updateData.position = position;
    }

    // Rien à mettre à jour ?
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ à mettre à jour" },
        { status: 400, headers: rateLimitHeaders(RATE_MAX, limit) }
      );
    }

    // Update — filtre par id ET providerId (défense en profondeur)
    const updated = await prisma.providerVideo.update({
      where: { id: videoId, providerId: session.user.id },
      data: updateData,
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
        updatedAt: true,
      },
    });

    return NextResponse.json(
      { ok: true, video: updated },
      { headers: rateLimitHeaders(RATE_MAX, limit) }
    );
  } catch (error) {
    console.error("[api/providers/me/videos] PATCH error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// ─── DELETE : supprimer une vidéo ───
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { videoId } = await params;

    if (!videoId || typeof videoId !== "string" || videoId.length > 64) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const guardResult = await guard(req, videoId);
    if ("error" in guardResult) return guardResult.error;
    const { session, limit } = guardResult;

    // Delete — filtre par id ET providerId
    await prisma.providerVideo.delete({
      where: { id: videoId, providerId: session.user.id },
    });

    return NextResponse.json(
      { ok: true, deleted: videoId },
      { headers: rateLimitHeaders(RATE_MAX, limit) }
    );
  } catch (error) {
    console.error("[api/providers/me/videos] DELETE error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}