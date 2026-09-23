"use client";
import NearbyMap from "./map/NearbyMap";
import Sidebar from "./sidebarComp";
import type { User } from "@/app/lib/auth-client";
interface AppClientProps {
  user: User;
}
const AppClient = ({ user }: AppClientProps) => {
  return (
    <div className="bg-white dark:bg-zinc-900 w-full h-screen flex">
      <Sidebar />
      <main className="flex-1 h-full">
        <NearbyMap />
      </main>
    </div>
  );
};
export default AppClient;