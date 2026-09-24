import Sidebar from "@/components/app/sidebarComp";
import VideoCompApp from "./compApp";
export default function VideoComp() {
   return (
    <div className="bg-white dark:bg-zinc-900 w-full h-screen flex">
      <Sidebar />
      <main className="flex-1 h-full">
        <VideoCompApp/>
      </main>
    </div>
  );
}