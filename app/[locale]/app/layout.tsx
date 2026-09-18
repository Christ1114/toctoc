
import { SessionProvider } from "@/app/context/SessionContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}