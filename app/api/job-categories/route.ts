
import { NextResponse } from "next/server";
import { getAllCategoryConfigs } from "@/app/lib/jobs/category-colors";
export const runtime = "edge";


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

    return NextResponse.json(
      { error: "Erreur serveur", categories: [], count: 0 },
      { status: 500 },
    );
  }
}