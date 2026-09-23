"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { getSession, type User } from "@/app/lib/auth-client";
interface SessionContextValue {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
}
const SessionContext = createContext<SessionContextValue | undefined>(undefined);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const { session } = await getSession();
      setUser((session?.user as unknown as User) ?? null);
    } catch (err) {
      console.error("Erreur chargement session (SessionProvider):", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return (
    <SessionContext.Provider value={{ user, loading, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession() doit être utilisé à l'intérieur de <SessionProvider>");
  }
  return ctx;
}