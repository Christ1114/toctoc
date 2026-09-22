import Sidebar from "@/components/app/sidebarComp";
import PublicClientProfilePage from "./clientCompApp";
const Comp = () => {
    return (
        <div className="bg-white dark:bg-zinc-900 w-full h-screen flex">
      <Sidebar />
      <main className="flex-1 h-full">
        <PublicClientProfilePage/>
      </main>
    </div>
    )
}   
export default Comp;