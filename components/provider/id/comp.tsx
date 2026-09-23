import Sidebar from "@/components/app/sidebarComp";
import PublicProviderProfilePage from "./compApp";
export default function ProviderPublicProfilePage() {
    return (
        <div className="bg-white dark:bg-zinc-900 w-full h-screen flex">
      <Sidebar />
      <main className="flex-1 h-full">
      <PublicProviderProfilePage/>
      </main>
    </div>
    )
}