"use client";
import React, { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import Image from "next/image";
import { orbitron } from '@/fonts/font';
import { useTranslations } from 'next-intl';
import img1 from "@/public/assets/pictures/number.png";
import Img2 from "@/public/assets/pictures/codeQr.jpg";
import Img3 from "@/public/assets/pictures/womanphone.png";
import { ChevronDown, ChevronUp, Phone, MapPin, Clock, Download, MessageCircle } from 'lucide-react';

interface FooterProps {
    id: number;
    title: string;
    href?: string;
}

export default function FooterComponent() {
    const t = useTranslations("footer");
    const router = useRouter();
    const [showMore, setShowMore] = useState(false);

    const FooterItem: FooterProps[] = [
        { id: 1, title: t("links.heading") },
        { id: 3, title: t("links.smsWarning"), href: "/warning" },
        { id: 4, title: t("links.privacyPolicy"), href: "/policy" },
        { id: 5, title: t("links.termsofuse"), href: "/termsofuse" },
    ];

    const [heading, ...links] = FooterItem;
    const currentYear = new Date().getFullYear();

    return (
        <div className={`w-full bg-white dark:bg-zinc-950 ${orbitron.className} border-t-2 sm:border-t-3 border-zinc-400 dark:border-zinc-700`}>
       
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0 border-b border-zinc-300 dark:border-zinc-700">
                
             
                <div className="flex sm:grid sm:grid-rows-[auto_auto] items-center justify-center sm:justify-items-center gap-3 sm:gap-y-2 py-3 px-2 sm:border-r border-b sm:border-b-0 border-zinc-300 dark:border-zinc-700">
               
                    <div className="hidden lg:flex lg:flex-col items-center gap-2">
                        <Image
                            src={Img2}
                            alt={t("alt.qrCode")}
                            width={100}
                            height={100}
                            className="object-contain rounded-lg lg:w-28 xl:w-32"
                            priority
                        />
                        <p className="text-xs font-bold text-[#432dd7] text-center leading-tight">
                            {t("downloadApp")}
                        </p>
                    </div>

                   
                    <button
                        onClick={() => router.push('/download')}
                        className="lg:hidden cursor-not-allowed bg-[#432dd7] w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] sm:text-xs font-bold text-white rounded-lg transition-all duration-300 hover:bg-[#3524b0] active:scale-95"
                    >
                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {t("downloadApp")}
                    </button>
                </div>

                
                <div className="flex sm:grid sm:grid-rows-[1fr_auto] items-center justify-center sm:justify-items-center gap-3 sm:gap-y-2 py-3 px-2 sm:border-r border-b sm:border-b-0 border-zinc-300 dark:border-zinc-700">
                    <div className="flex sm:grid sm:grid-cols-[auto_1fr] items-center gap-2 sm:gap-x-3">
                        <Image
                            src={img1}
                            alt={t("alt.numberIcon")}
                            width={60}
                            height={60}
                            className="object-contain w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16"
                            priority
                        />
                        <div className="grid gap-0.5 sm:gap-1">
                            <p className="flex items-center gap-1 text-[8px] sm:text-[10px] lg:text-xs font-bold text-black dark:text-zinc-300 leading-tight">
                                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#432dd7] shrink-0" />
                                <span>{t("hours")}</span>
                            </p>
                            <p className="flex items-center gap-1 text-[8px] sm:text-[10px] lg:text-xs font-bold text-black dark:text-zinc-300 leading-tight">
                                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#432dd7] shrink-0" />
                                <span>{t("location")}</span>
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/contact')}
                        className="w-full sm:w-auto cursor-pointer bg-zinc-500 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-[8px] sm:text-[9px] lg:text-[10px] font-bold text-white rounded-md transition-all duration-300 hover:bg-zinc-600 active:scale-95"
                    >
                        <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        {t("contactBtn")}
                    </button>
                </div>

                
                <div className="hidden sm:grid items-center justify-items-center py-3 px-2">
                    <Image
                        src={Img3}
                        alt={t("alt.womanPhone")}
                        width={80}
                        height={80}
                        className="object-contain w-16 sm:w-20 lg:w-28 xl:w-32"
                        priority
                    />
                </div>
            </div>

            
            <button
                onClick={() => setShowMore(!showMore)}
                className="sm:hidden flex items-center justify-center gap-2 w-full py-2.5 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 hover:text-[#432dd7] dark:hover:text-[#432dd7] transition-colors duration-200 border-b border-zinc-300 dark:border-zinc-700"
            >
                {heading.title}
                {showMore ? 
                    <ChevronUp className="w-3.5 h-3.5" /> : 
                    <ChevronDown className="w-3.5 h-3.5" />
                }
            </button>

          
            {showMore && (
                <div className="sm:hidden grid gap-y-2 py-3 px-4 border-b border-zinc-300 dark:border-zinc-700 justify-items-center bg-zinc-50 dark:bg-zinc-900">
                    <div className="grid gap-y-2 justify-items-center">
                        {links.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href || ""}
                                className="hover:underline hover:underline-offset-4 font-bold text-[11px] text-black dark:text-zinc-300 py-1"
                            >
                                {item.title}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

         
            <div className="hidden sm:flex items-center justify-center gap-x-6 lg:gap-x-8 py-3 px-4 border-b border-zinc-300 dark:border-zinc-700">
                <span className="font-bold text-[11px] lg:text-[12px] text-black dark:text-zinc-300">
                    {heading.title}
                </span>
                {links.map((item) => (
                    <Link
                        key={item.id}
                        href={item.href || ""}
                        className="hover:underline hover:underline-offset-4 font-bold text-[11px] lg:text-[12px] text-black dark:text-zinc-300 transition-colors hover:text-[#432dd7] dark:hover:text-[#432dd7]"
                    >
                        {item.title}
                    </Link>
                ))}
            </div>

           
            <div className="flex items-center justify-center p-2 sm:p-3">
                <p className="max-w-3xl font-bold text-center text-[8px] sm:text-[9px] lg:text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400 px-4">
                    {t("copyright", { years: `2024-${currentYear}` })}
                </p>
            </div>
        </div>
    );
};