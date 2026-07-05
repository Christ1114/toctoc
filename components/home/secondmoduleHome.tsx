"use client";

import { bebas_neue, montserrat, orbitron } from '@/fonts/font';
import React from 'react';
import { useTranslations } from 'next-intl';
import Image, { StaticImageData } from "next/image";



const SecondModuleHome = () => {
const t = useTranslations("secondModuleHome");
  return (
  <>
  <div className=" flex items-center justify-between gap-x-5">
    <h2 className={`${orbitron.className} antialiased text-sm font-bold `}>{t("H2_title")}</h2>
    <p className={`  text-[15px] `}> {t("description1")}</p>
  </div>  
  </>
  )
}

export default SecondModuleHome;