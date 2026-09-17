import Sidebar from "@/components/app/sidebarComp";
import AppProfil from "@/components/app/profile/AppProfil";
const Comp = () => {
    return (
        <div className="bg-white dark:bg-zinc-900 w-full h-screen flex">
      <Sidebar />
      <main className="flex-1 h-full">
        <AppProfil/>
      </main>
    </div>
    )
}   
export default Comp;