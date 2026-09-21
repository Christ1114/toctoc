"use server";

import { cookies, headers } from "next/headers";
import { signValue } from "@/components/utils/security-cookie";
import { validateLocation } from "@/app/lib/security/locationCheck";
import { checkVpnStatus } from "@/app/lib/security/vpnCheck";

export type PrecheckResult =
  | { ok: true }
  | { ok: false; reason: "location" | "vpn" | "rate_limited" | "error" };

const attemptsMap = new Map<string, { count: number; timestamp: number }>();
const WINDOW = 60 * 1000;
const MAX_ATTEMPTS = 5;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attemptsMap.get(key);
  if (!entry || now - entry.timestamp > WINDOW) {
    attemptsMap.set(key, { count: 1, timestamp: now });
    return false;
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

export async function performPrecheck(
  latitude: number,
  longitude: number
): Promise<PrecheckResult> {
  try {
    // 0. Rate limit — une Server Action est appelable sans passer par ton UI
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      "unknown";
    if (isRateLimited(`precheck:${ip}`)) {
      return { ok: false, reason: "rate_limited" };
    }

    // 1. Validation localisation — côté serveur
    const location = validateLocation(latitude, longitude, {
      usePolygon: true,
      checkRegion: true,
    });
    if (!location.isValid) return { ok: false, reason: "location" };

    // 2. VPN check — côté serveur (checkVpnStatus extrait l'IP des headers lui-même)
    const vpnResult = await checkVpnStatus(
      h as unknown as Headers
    );
    if (vpnResult.isVpn) return { ok: false, reason: "vpn" };

    // 3. Signature + cookie httpOnly — impossible à forger depuis le client
    const secret = process.env.SECURITY_CHECK_SECRET;
    if (!secret) throw new Error("SECURITY_CHECK_SECRET manquant");

    const signed = await signValue(String(Date.now()), secret);
    const cookieStore = await cookies();
    cookieStore.set("security_check_passed", signed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 60,
    });

    return { ok: true };
  } catch (err) {
    console.error("Erreur precheck:", err);
    return { ok: false, reason: "error" };
  }
}