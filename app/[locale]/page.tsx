import Navbar from "@/components/shared/navbar/navbar";
import FirstModuleHome from "@/components/home/firstmoduleHome";
import SecondModuleHome from "@/components/home/secondmoduleHome";
import ThirdModuleComponent from "@/components/home/thirdmoduleHome";
import FourModuleHome from "@/components/home/fourmoduleHome";
import FivemoduleHome from "@/components/home/fivemoduleHome";
import SixModuleHome from "@/components/home/sixmoduleHome";
import SevenmoduleHome from "@/components/home/sevenmoduleHome";
import { orbitron } from "@/fonts/font";
import IntroTocToc from "@/animate/toctocIntro";
import FooterComponent from "@/components/footer/footer";
import { useTranslations, useLocale } from 'next-intl';
import SevenModuleHome from "@/components/home/sevenmoduleHome";

export default function Home() {
  const t = useTranslations("home");
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <div className="h-full w-full overflow-x-hidden bg-white dark:bg-zinc-900 px-4 sm:px-5" dir={isRtl ? 'rtl' : 'ltr'} >
      <header className="mb-4 sm:mb-6  lg:mb-8 flex w-full cursor-default">
        <Navbar />
      </header>
      <main className="relative flex w-full flex-col pt-5 xl:pt-0  sm:pt-16 lg:pt-19">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-0">
          <div className="w-full   sm:pt-5 lg:w-2/3">
            <FirstModuleHome />
          </div>
           <div className="w-full lg:w-1/3">
            <ThirdModuleComponent />
           </div>
        </div>
        <div className="flex flex-col xl:flex-row items-center lg:items-start justify-between gap-6 lg:gap-0 mt-6 lg:mt-0">
          <div className="w-full lg:w-2/3 flex items-center justify-center">
            <FivemoduleHome />
          </div>  
          <div className="w-full lg:w-1/2 lg:translate-y-10 ">
           <FourModuleHome />
          </div>
        </div>
        <div className="flex items-center justify-center mt-6 lg:mt-0">
           <SecondModuleHome/>
        </div>
        <div className="flex flex-col lg:flex-row items-center justify-between mt-10 lg:mt-15 gap-6 lg:gap-0">
          <div className="w-full lg:w-1/2 flex items-center justify-center">
            <SixModuleHome/>
          </div>
          <div className="w-full lg:w-1/2 flex items-center justify-center lg:-mt-11">
            <SevenModuleHome/>
          </div>
        </div>
        <div className="flex items-center justify-center mt-8 lg:mt-5">
          <IntroTocToc/>
        </div>
      </main>
      <footer className="w-full h-full mt-8 sm:mt-12 lg:mt-16">
        <FooterComponent />
      </footer>
    </div>
  );
}