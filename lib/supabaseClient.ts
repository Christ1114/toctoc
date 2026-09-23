// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export async function getAuthedSupabaseClient() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    console.error("[Auth] Pas de session:", error);
    throw new Error("Utilisateur non authentifié");
  }
  return supabase;
}