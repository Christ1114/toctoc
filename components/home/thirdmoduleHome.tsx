"use client";
import { orbitron } from '@/fonts/font';
import React from 'react';
import { useTranslations } from 'next-intl';

const ThirdModuleComponent = () => {
  const t = useTranslations("thirdModuleHome");

  return (
    <div className='w-full pt-15 flex flex-col max-w-full h-full gap-y-3 -translate-x-10'>
      <div className="flex flex-col gap-y-2 items-center justify-center border-2 border-zinc-400 p-5">
        <h1 className={`text-center text-xs font-bold ${orbitron.className} antialiased`}>
          {t("title1")}
        </h1>
        <button className="cursor-pointer bg-[#432dd7] hover:bg-[#432dd7]/80 text-white px-4 py-2">
          {t("btnAdvancedSearch")}
        </button>
      </div>
      <div className="flex flex-col gap-y-2 items-center justify-center border-2 border-zinc-400 p-5">
        <h1 className={`text-center text-xs font-bold ${orbitron.className} antialiased`}>
          {t("title2")}
        </h1>
      </div>
    </div>
  );
}

export default ThirdModuleComponent;