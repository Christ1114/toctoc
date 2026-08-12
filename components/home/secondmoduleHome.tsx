import { orbitron } from '@/fonts/font';
import React from 'react';
import { useTranslations } from 'next-intl';

const SecondModuleHome = () => {
  const t = useTranslations("secondModuleHome");

  return (
    <div className={`flex flex-col items-center justify-center
    px-4 sm:px-6 lg:px-8 xl:px-10
    ${orbitron.className} antialiased`}>

      <h2 className={`${orbitron.className} antialiased font-bold w-full flex items-center justify-center text-center
      text-xl sm:text-2xl lg:text-3xl xl:text-4xl
      mb-2 sm:mb-3 xl:mb-4`}>
        {t("H2_title")}
      </h2>

      <p className={`dark:text-stone-400 text-black text-center
      text-xs sm:text-sm lg:text-base xl:text-lg
      w-full max-w-75 sm:max-w-100 lg:max-w-125 xl:max-w-150`}>
        {t("description1")}
      </p>
    </div>
  );
};

export default SecondModuleHome;