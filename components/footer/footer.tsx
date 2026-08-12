"use client";
import React, { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import Image from "next/image";
import { orbitron } from '@/fonts/font';
import { useTranslations } from 'next-intl';
import img1 from "@/public/assets/pictures/number.png";
import Img2 from "@/public/assets/pictures/codeQr.jpg";
import Img3 from "@/public/assets/pictures/womanphone.png";

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
    ];

    const [heading, ...links] = FooterItem;
    const currentYear = new Date().getFullYear();

    return (
        <div className={`w-full bg-white dark:bg-zinc-950 ${orbitron.className} border-t-3 border-zinc-500`}>
            <div className="grid 
                            grid-cols-3
                            gap-0
                            border-b border-zinc-500">
                <div className="grid grid-rows-[auto_auto] items-center justify-items-center 
                                gap-y-2 py-3 px-2
                                border-r border-gray-200 dark:border-zinc-700
                                sm:border-gray-400">
                    <Image
                        src={Img2}
                        alt={t("alt.qrCode")}
                        width={80}
                        height={80}
                        className="object-contain rounded-lg w-17.5 sm:w-25 lg:w-35"
                        priority
                    />
                    <p className={`text-[9px] sm:text-xs font-bold text-[#432dd7] text-center leading-tight ${orbitron.className}`}>
                        {t("downloadApp")}
                    </p>
                </div>
                <div className="grid grid-rows-[1fr_auto] items-center justify-items-center 
                                gap-y-2 py-3 px-2
                                border-r border-gray-200 dark:border-zinc-700
                                sm:border-gray-400">
                    
                    <div className="grid grid-cols-[auto_1fr] items-center gap-x-2">
                        <Image
                            src={img1}
                            alt={t("alt.numberIcon")}
                            width={100}
                            height={100}
                            className="object-contain sm:w-15 lg:w-20"
                            priority
                        />
                        <div className="grid gap-0.5">
                            <p className={`text-[8px] sm:text-[10px] lg:text-xs font-bold text-black dark:text-zinc-300 leading-tight ${orbitron.className}`}>
                                {t("hours")}
                            </p>
                            <p className={`text-[8px] sm:text-[10px] lg:text-xs font-bold text-black dark:text-zinc-300 leading-tight ${orbitron.className}`}>
                                {t("location")}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/contact')}
                        className="w-full cursor-pointer bg-zinc-500 
                                   p-1.5 sm:p-2 
                                   text-[8px] sm:text-[9px] lg:text-[10px] font-bold text-white 
                                   rounded-md
                                   transition-all duration-300 
                                   hover:bg-zinc-600 active:scale-95"
                    >
                        {t("contactBtn")}
                    </button>
                </div>
                <div className="grid items-center justify-items-center py-3 px-2">
                    <Image
                        src={Img3}
                        alt={t("alt.womanPhone")}
                        width={100}
                        height={100}
                        className="object-contain w-17.5 sm:w-25 lg:w-35"
                        priority
                    />
                </div>
            </div>
            <button
                onClick={() => setShowMore(!showMore)}
                className="grid grid-flow-col items-center justify-center gap-1 
                           w-full py-2 sm:hidden
                           text-[10px] font-bold text-zinc-500 dark:text-zinc-400
                           hover:text-[#432dd7] dark:hover:text-[#432dd7]
                           transition-colors duration-200
                           border-b border-gray-200 dark:border-zinc-700"
            >
                {heading.title}
                <span className="text-[8px]">{showMore ? '▲' : '▼'}</span>
            </button>
            {showMore && (
                <div className="grid sm:hidden gap-y-2 py-4 px-4 
                                border-b border-gray-200 dark:border-zinc-700
                                justify-items-center">
                    <div className="grid gap-y-1.5 justify-items-center">
                        {links.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href || ""}
                                className="hover:underline hover:underline-offset-4 font-bold text-[11px] text-black dark:text-zinc-300"
                            >
                                {item.title}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
            <div className="hidden sm:grid grid-flow-col items-center justify-center gap-x-6 py-3 px-4 
                            border-b border-zinc-500">
                <span className="font-bold text-[12px] text-black dark:text-zinc-300">
                    {heading.title}
                </span>
                {links.map((item) => (
                    <Link
                        key={item.id}
                        href={item.href || ""}
                        className="hover:underline hover:underline-offset-4 font-bold text-[12px] text-black dark:text-zinc-300"
                    >
                        {item.title}
                    </Link>
                ))}
            </div>
            <div className="grid items-center justify-center p-2 sm:p-3">
                <p className="max-w-3xl font-bold text-center text-[9px] sm:text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {t("copyright", { years: `2024-${currentYear}` })}
                </p>
            </div>
        </div>
    );
};