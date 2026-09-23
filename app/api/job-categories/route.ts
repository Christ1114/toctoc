// app/api/job-categories/route.ts
import { NextResponse } from "next/server";
import { getAllCategoryConfigs } from "@/app/lib/jobs/category-colors";

/* ═══════════════════════════════════════════════════════════
   GET /api/job-categories
   ─────────────────────────────────────────────────────────
   - Edge runtime : réponse <10ms depuis le CDN
   - Cache 24h + stale-while-revalidate (jamais de cold wait)
   - Aucune DB, aucune dépendance externe
   - La config change ~jamais → cache très long
   ═══════════════════════════════════════════════════════════ */

export const runtime = "edge";
// ⚠️ revalidate retiré : ignoré quand Cache-Control est défini manuellement

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
  "CDN-Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
  "Vercel-CDN-Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
} as const;

export async function GET() {
  try {
    const categories = getAllCategoryConfigs();

    return NextResponse.json(
      { categories, count: categories.length },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[job-categories] error", error);
    }
    // TODO: Sentry.captureException(error)

    return NextResponse.json(
      { error: "Erreur serveur", categories: [], count: 0 },
      { status: 500 },
    );
  }
}