import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/lib/auth";
import { createAnnouncementSchema } from "@/app/lib/validators/announcement";
import {
  checkRateLimit,
  rateLimitHeaders,
  getClientIp,
} from "@/app/lib/security/rate-limit";
/* ═══════════════ Constantes ═══════════════ */
const READ_RATE_LIMIT_MAX = 100; // GET public
const READ_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const WRITE_RATE_LIMIT_MAX = 20; // PATCH/DELETE
const WRITE_RATE_LIMIT_WINDOW_MS = 60 * 1000;
/* ═══════════════ Validation PATCH (tous les champs optionnels) ═══════════════ */
const updateAnnouncementSchema = createAnnouncementSchema.partial();
/* ═══════════════ Validation des params URL ═══════════════ */
const idSchema = z.string().min(1).max(50);
/* ═══════════════════════════════════════════════════════════
   GET — Récupérer une annonce (public, rate-limité par IP)
   ═══════════════════════════════════════════════════════════ */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── 1. Rate limit par IP ──
    const ip = getClientIp(await headers());
    const rl = await checkRateLimit(
      `announce:read:${ip}`,
      READ_RATE_LIMIT_MAX,
      READ_RATE_LIMIT_WINDOW_MS
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez plus tard." },
        { status: 429, headers: rateLimitHeaders(READ_RATE_LIMIT_MAX, rl) }
      );
    }
    // ── 2. Valider l'ID ──
    const { id } = await params;
    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }
    // ── 3. Récupérer l'annonce ──
    const announcement = await prisma.announcement.findUnique({
      where: { id: parsedId.data },
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        salaryMin: true,
        salaryMax: true,
        salaryPeriod: true,
        salaryRaw: true,
        isUrgent: true,
        workArrangement: true,
        shift: true,
        contractDuration: true,
        transportAllowance: true,
        workDays: true,
        workStartTime: true,
        workEndTime: true,
        experienceYearsRequired: true,
        city: true,
        location: true,
        contactPhone: true,
        contactWhatsapp: true,
        isFeatured: true,
        isVerified: true,
        isUserGenerated: true,
        viewCount: true,
        postedAt: true,
        createdAt: true,
        updatedAt: true,
        jobType: {
          select: { id: true, name: true, slug: true, category: true },
        },
        region: {
          select: { id: true, name: true, slug: true, latitude: true, longitude: true },
        },
        // userId volontairement retiré : pas besoin côté client,
        // et ça évite de faciliter l'énumération des users
      },
    });
    if (!announcement) {
      return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
    }
    return NextResponse.json(
      { announcement },
      {
        headers: {
          ...rateLimitHeaders(READ_RATE_LIMIT_MAX, rl),
          // Cache public : 30s CDN + revalidation en arrière-plan
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Erreur GET announcement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
/* ═══════════════════════════════════════════════════════════
   PATCH — Modifier une annonce (owner only)
   ═══════════════════════════════════════════════════════════ */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── 1. Auth ──
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    // ── 2. Charger user + flags ──
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        isActive: true,
        banned: true,
        banExpires: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }
    if (user.banned && (!user.banExpires || user.banExpires > new Date())) {
      return NextResponse.json({ error: "Compte suspendu" }, { status: 403 });
    }
    if (!user.isActive) {
      return NextResponse.json({ error: "Compte désactivé" }, { status: 403 });
    }
    // ── 3. Rate limit par user ──
    const rl = await checkRateLimit(
      `announce:write:${user.id}`,
      WRITE_RATE_LIMIT_MAX,
      WRITE_RATE_LIMIT_WINDOW_MS
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de modifications. Réessayez plus tard." },
        { status: 429, headers: rateLimitHeaders(WRITE_RATE_LIMIT_MAX, rl) }
      );
    }
    // ── 4. Valider l'ID ──
    const { id } = await params;
    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }
    // ── 5. Vérifier l'annonce + propriété ──
    const existing = await prisma.announcement.findUnique({
      where: { id: parsedId.data },
      select: { id: true, userId: true, isUserGenerated: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      // On renvoie 404 et pas 403 pour ne pas confirmer l'existence
      // d'une annonce qu'on ne possède pas (anti-énumération)
      return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
    }
    if (!existing.isUserGenerated) {
      return NextResponse.json(
        { error: "Cette annonce ne peut pas être modifiée" },
        { status: 403 }
      );
    }
    // ── 6. Validation Zod ──
    const json = await req.json().catch(() => null);
    if (!json || typeof json !== "object") {
      return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
    }
    const parsed = updateAnnouncementSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: z.treeifyError(parsed.error) },
        { status: 400 }
      );
    }
    const data = parsed.data;
    // ── 7. Si jobTypeId / regionId fournis, vérifier existence ──
    const [jobType, region] = await Promise.all([
      data.jobTypeId
        ? prisma.jobType.findUnique({ where: { id: data.jobTypeId } })
        : Promise.resolve(null),
      data.regionId
        ? prisma.region.findUnique({ where: { id: data.regionId } })
        : Promise.resolve(null),
    ]);
    if (data.jobTypeId && !jobType) {
      return NextResponse.json({ error: "Poste introuvable" }, { status: 400 });
    }
    if (data.regionId && !region) {
      return NextResponse.json({ error: "Localisation introuvable" }, { status: 400 });
    }
    // ── 8. Construire le payload de mise à jour (seulement les champs fournis) ──
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description ?? null;
    if (data.jobTypeId !== undefined) updateData.jobTypeId = data.jobTypeId;
    if (data.regionId !== undefined) updateData.regionId = data.regionId;
    if (data.salaryMin !== undefined) updateData.salaryMin = data.salaryMin ?? null;
    if (data.salaryPeriod !== undefined) updateData.salaryPeriod = data.salaryPeriod ?? null;
    if (data.city !== undefined) updateData.city = data.city ?? null;
    if (data.workArrangement !== undefined) updateData.workArrangement = data.workArrangement ?? null;
    if (data.shift !== undefined) updateData.shift = data.shift ?? null;
    if (data.contractDuration !== undefined) updateData.contractDuration = data.contractDuration ?? null;
    if (data.workDays !== undefined) updateData.workDays = data.workDays ?? [];
    if (data.workStartTime !== undefined) updateData.workStartTime = data.workStartTime ?? null;
    if (data.workEndTime !== undefined) updateData.workEndTime = data.workEndTime ?? null;
    if (data.experienceYearsRequired !== undefined) updateData.experienceYearsRequired = data.experienceYearsRequired ?? null;
    if (data.isUrgent !== undefined) updateData.isUrgent = data.isUrgent;
    if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone ?? null;
    if (data.contactWhatsapp !== undefined) updateData.contactWhatsapp = data.contactWhatsapp ?? null;
    // Si rien à modifier
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ à modifier" },
        { status: 400 }
      );
    }
    // ── 9. Mise à jour ──
    const announcement = await prisma.announcement.update({
      where: { id: parsedId.data },
      data: updateData,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        salaryMin: true,
        salaryPeriod: true,
        city: true,
        isUrgent: true,
        updatedAt: true,
        jobType: { select: { id: true, name: true, slug: true } },
        region: { select: { id: true, name: true, slug: true } },
      },
    });
    return NextResponse.json(
      { announcement },
      {
        headers: {
          ...rateLimitHeaders(WRITE_RATE_LIMIT_MAX, rl),
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Erreur PATCH announcement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
/* ═══════════════════════════════════════════════════════════
   DELETE — Supprimer une annonce (owner only)
   ═══════════════════════════════════════════════════════════ */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── 1. Auth ──
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    // ── 2. Charger user + flags ──
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isActive: true, banned: true, banExpires: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }
    if (user.banned && (!user.banExpires || user.banExpires > new Date())) {
      return NextResponse.json({ error: "Compte suspendu" }, { status: 403 });
    }
    if (!user.isActive) {
      return NextResponse.json({ error: "Compte désactivé" }, { status: 403 });
    }
    // ── 3. Rate limit par user ──
    const rl = await checkRateLimit(
      `announce:write:${user.id}`,
      WRITE_RATE_LIMIT_MAX,
      WRITE_RATE_LIMIT_WINDOW_MS
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de modifications. Réessayez plus tard." },
        { status: 429, headers: rateLimitHeaders(WRITE_RATE_LIMIT_MAX, rl) }
      );
    }
    // ── 4. Valider l'ID ──
    const { id } = await params;
    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }
    // ── 5. Vérifier l'annonce + propriété ──
    const existing = await prisma.announcement.findUnique({
      where: { id: parsedId.data },
      select: { id: true, userId: true, isUserGenerated: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
    }
    if (!existing.isUserGenerated) {
      return NextResponse.json(
        { error: "Cette annonce ne peut pas être supprimée" },
        { status: 403 }
      );
    }
    // ── 6. Suppression ──
    await prisma.announcement.delete({ where: { id: parsedId.data } });
    return NextResponse.json(
      { success: true },
      {
        headers: {
          ...rateLimitHeaders(WRITE_RATE_LIMIT_MAX, rl),
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Erreur DELETE announcement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}