"use client";
import React from 'react';
import Link from 'next/link';
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

    const FooterItem: FooterProps[] = [
        { id: 1, title: t("links.heading") },
        { id: 2, title: t("links.all"), href: "" },
        { id: 3, title: t("links.smsWarning"), href: "" },
        { id: 4, title: t("links.privacyPolicy"), href: "" },
    ];

    const [heading, ...links] = FooterItem;
    const [firstLink, ...restLinks] = links;

    const currentYear = new Date().getFullYear();

    return (
        <div className={`w-full h-full border-t-3 border-zinc-500 bg-white dark:bg-zinc-950 ${orbitron.className} px-7 pt-5`}>
            <div className="grid grid-cols-3 border-b border-zinc-500">
                <div className="flex flex-col items-start justify-center gap-y-3 border-r border-gray-400 pr-5">
                    <div className="flex flex-row items-center gap-x-2">
                        <span className="font-bold text-[12px] text-black dark:text-zinc-300">
                            {heading.title}
                        </span>
                        {firstLink && (
                            <Link
                                href={firstLink.href || ""}
                                className="flex items-center gap-x-2 hover:underline hover:underline-offset-4 font-bold text-[12px] text-black dark:text-zinc-300"
                            >
                                {firstLink.title}
                            </Link>
                        )}
                    </div>
                    {restLinks.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href || ""}
                            className="hover:underline hover:underline-offset-4 font-bold text-[12px] text-black dark:text-zinc-300"
                        >
                            {item.title}
                        </Link>
                    ))}
                </div>
                <div className="flex flex-col items-center justify-center gap-y-3 border-r border-gray-400 px-5">
                    <div className="flex items-center gap-x-3">
                        <Image
                            src={img1}
                            alt={t("alt.numberIcon")}
                            width={100}
                            height={60}
                            className="object-contain"
                            priority
                        />
                        <p className={`text-start text-xs font-bold text-black dark:text-zinc-300 ${orbitron.className}`}>
                            {t("hours")}
                            <br />
                            {t("location")}
                        </p>
                    </div>
                    <button className="w-full max-w-50 cursor-pointer bg-zinc-500 p-2 text-[9px] font-bold text-white transition-all duration-300 hover:scale-110">
                        {t("contactBtn")}
                    </button>
                </div>
                <div className="flex items-center justify-center gap-x-3 p-2">
                    <div className="flex flex-col items-center justify-center">
                        <Image
                            src={Img2}
                            alt={t("alt.qrCode")}
                            width={140}
                            height={60}
                            className="object-contain"
                            priority
                        />
                        <p className={`text-start text-xs font-bold text-[#432dd7] ${orbitron.className}`}>
                            {t("downloadApp")}
                        </p>
                    </div>
                    <Image
                        src={Img3}
                        alt={t("alt.womanPhone")}
                        width={140}
                        height={60}
                        className="object-contain"
                        priority
                    />
                </div>
            </div>
            <div className="flex items-start justify-center p-2">
                <p className="max-w-3xl font-bold text-center text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t("copyright", { years: `2024-${currentYear}` })}
                </p>
            </div>
        </div>
    );
}