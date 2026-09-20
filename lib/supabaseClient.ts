// lib/supabase.ts ou utils/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Version authentifiée
export async function getAuthedSupabaseClient() {
  // Récupère la session actuelle
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("No active session");
  }

  // Crée un client avec le token de l'utilisateur
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  });
}