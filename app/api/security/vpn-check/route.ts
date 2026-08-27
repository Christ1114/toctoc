
import { NextRequest, NextResponse } from "next/server";
import { checkVpnStatus } from "@/app/lib/security/vpnCheck";
import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";

const rateLimitMap = new Map < string,
	{ count: number;timestamp: number } > ();
const RATE_LIMIT_WINDOW = 60 * 1000; 
const RATE_LIMIT_MAX = 10; 

export async function GET(req: NextRequest) {
	try {
		
		const session = await auth.api.getSession({
			headers: await headers(), // ← Utilisez await headers() ici
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
		}

		// 2. Vérifier l'origine de la requête
		const origin = req.headers.get("origin");
		const host = req.headers.get("host");

		if (origin && host && new URL(origin).host !== host) {
			return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
		}

		// 3. Vérifier le header personnalisé
		const internalHeader = req.headers.get("x-internal-request");
		if (internalHeader !== process.env.INTERNAL_REQUEST_SECRET) {
			return NextResponse.json({ error: "Requête non autorisée" }, { status: 403 });
		}

		// 4. Rate limiting
		const userId = session.user.id;
		const now = Date.now();
		const userRate = rateLimitMap.get(userId);

		if (userRate) {
			if (now - userRate.timestamp > RATE_LIMIT_WINDOW) {
				rateLimitMap.set(userId, { count: 1, timestamp: now });
			} else if (userRate.count >= RATE_LIMIT_MAX) {
				return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
			} else {
				userRate.count++;
			}
		} else {
			rateLimitMap.set(userId, { count: 1, timestamp: now });
		}

		// 5. Exécuter la vérification VPN
		const result = await checkVpnStatus(req.headers);
		return NextResponse.json(result);

	} catch (error) {
		console.error("Erreur check-vpn:", error);
		return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
	}
}