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

export default function Home() {
  const t = useTranslations("home");
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <div className={`h-full w-full overflow-x-hidden bg-white dark:bg-zinc-900`} dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="mb-8 flex w-full cursor-default">
        <Navbar />
      </header>

      <main className="relative flex w-full flex-col gap-8 p-5">
     
        <div className="flex w-full flex-col items-center justify-center gap-8 lg:flex-row lg:items-start lg:gap-10">
          <div className="flex w-full flex-col items-center justify-center gap-y-2 px-4 ">
            <FirstModuleHome />
            <SecondModuleHome />
            <FivemoduleHome />
          </div>

          <div className="flex w-full flex-col gap-y-5 px-4 sm:px-5 lg:w-1/3">
            <ThirdModuleComponent />
            <FourModuleHome />
          </div>
        </div>
        
        <div className="flex w-full gap-x-8">
          <div className="flex items-center justify-center w-1/2">
            <SixModuleHome />
          </div>
          <div className="w-1/2 flex items-center justify-center border-l border-blue-300 rounded-full">
            <SevenmoduleHome />
          </div>
        </div>
        
        <div className={`flex items-center mt-10 ${isRtl ? 'translate-x-90' : 'translate-x-90'} justify-center w-150 max-w-full`}>
          <h1 className={`text-center text-2xl font-bold ${orbitron.className} antialiased wrap-break-words ${isRtl ? 'text-base md:text-lg lg:text-2xl' : ''}`}>
            "{t("quote.text")} <span className="underline underline-1 underline-offset-4">{t("quote.highlight")}</span>"
          </h1>
        </div>
        
        <div className="w-full h-full">
          <IntroTocToc />
        </div>
      </main>
      
      <footer className="w-full h-full">
        <FooterComponent />
      </footer>
    </div>
  );
}