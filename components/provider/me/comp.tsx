import Sidebar from "@/components/app/sidebarComp";
import ProviderPrivateProfilePageT from "./compApp";
export default function ProviderPrivateProfilePage() {
    return (
        <div className="bg-white dark:bg-zinc-900 w-full h-screen flex">
      <Sidebar />
      <main className="flex-1 h-full">
       <ProviderPrivateProfilePageT/>
      </main>
    </div>
    )
}