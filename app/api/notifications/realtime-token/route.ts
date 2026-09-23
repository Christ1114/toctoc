import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import jwt from "jsonwebtoken";
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    console.error("SUPABASE_JWT_SECRET manquant");
    return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });
  }
  const token = jwt.sign(
    {
      sub: session.user.id,
      role: "authenticated",
      aud: "authenticated",
    },
    secret,
    { expiresIn: "1h" }
  );
  return NextResponse.json({ token });
}