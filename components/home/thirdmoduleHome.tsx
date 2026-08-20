"use client";

import { orbitron } from '@/fonts/font';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

const ThirdModuleComponent = () => {
  const t = useTranslations("thirdModuleHome");
  const router = useRouter();

  return (
    <div className='w-full pt-15 xl:pt-20
                    px-3 sm:px-4 lg:px-6 xl:px-8
                    items-stretch'>

      <div className="flex flex-col gap-y-2 sm:gap-y-3 xl:gap-y-4 items-center justify-center 
                      border-2 border-zinc-400 p-4 sm:p-5 lg:p-6 xl:p-8
                      rounded-lg sm:rounded-xl
                      transition-all duration-300
                      hover:border-zinc-300 hover:shadow-md
                      max-w-4xl xl:max-w-5xl mx-auto">
        <h2 className={`text-center font-bold text-zinc-800 dark:text-white
                        text-xs sm:text-sm lg:text-base xl:text-lg
                        ${orbitron.className} antialiased
                        leading-relaxed sm:leading-normal`}>
          {t("title1")}
        </h2>
        <button
          onClick={() => router.push('/login')}
          className={`cursor-pointer bg-[#432dd7] hover:bg-[#432dd7]/80 text-white 
                           px-3 py-1.5 sm:px-3.5 sm:py-2 lg:px-4 lg:py-2.5 xl:px-5 xl:py-3
                           text-[11px] sm:text-xs lg:text-sm xl:text-base
                           rounded-md sm:rounded-lg
                           font-medium
                           transition-all duration-300
                           hover:scale-105 active:scale-95
                           max-w-full w-full sm:w-auto whitespace-normal wrap-break-words text-center leading-snug ${orbitron.className}`}>
          {t("btnAdvancedSearch")}
        </button>
      </div>
    </div>
  );
}

export default ThirdModuleComponent;