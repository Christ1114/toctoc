
import { NextRequest, NextResponse } from "next/server";
import { validateLocation } from "@/app/lib/security/locationCheck";
import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";


const rateLimitMap = new Map < string,
	{ count: number;timestamp: number } > ();
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
			return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
		}

		
		const origin = req.headers.get("origin");
		const host = req.headers.get("host");

		if (origin && host && new URL(origin).host !== host) {
			return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
		}


		const internalHeader = req.headers.get("x-internal-request");
		if (internalHeader !== process.env.INTERNAL_REQUEST_SECRET) {
			return NextResponse.json({ error: "Requête non autorisée" }, { status: 403 });
		}

		const userId = session.user.id;
		const now = Date.now();
		const userRate = rateLimitMap.get(userId);

		if (userRate) {
			if (now - userRate.timestamp > RATE_LIMIT_WINDOW) {
			
				rateLimitMap.set(userId, { count: 1, timestamp: now });
			} else if (userRate.count >= RATE_LIMIT_MAX) {
				return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
			} else {
				
				rateLimitMap.set(userId, {
					count: userRate.count + 1,
					timestamp: userRate.timestamp
				});
			}
		} else {
			rateLimitMap.set(userId, { count: 1, timestamp: now });
		}

	
		const body = await req.json().catch(() => null);

		if (!body || typeof body.lat !== "number" || typeof body.lng !== "number") {
			return NextResponse.json({ isValid: false, reason: "payload-invalide" }, { status: 400 });
		}

	
		if (
			!Number.isFinite(body.lat) ||
			!Number.isFinite(body.lng) ||
			body.lat < -90 ||
			body.lat > 90 ||
			body.lng < -180 ||
			body.lng > 180
		) {
			return NextResponse.json({ isValid: false, reason: "coordonnees-invalides" }, { status: 400 });
		}

	
		const result = validateLocation(body.lat, body.lng);

	
		console.log("[LOCATION_CHECK]", {
			userId: session.user.id,
			lat: body.lat,
			lng: body.lng,
			isValid: result.isValid,
			reason: result.reason,
			timestamp: new Date().toISOString(),
		});

		return NextResponse.json(result);

	} catch (error) {
		console.error("Erreur validate-location:", error);
		return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
	}
} 