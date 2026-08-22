"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import Image from "next/image";
import Lg from "../../../public/assets/logo/logo.svg";
import { orbitron } from '@/fonts/font';
import { XIcon, List, SignIn } from "@phosphor-icons/react";
import LightNightComponent from "../light-night/lightNight";
import { useLocale, useTranslations } from 'next-intl';
import TranslateFunction from '../translate/translateFunction';

interface NavbarItem {
    title: string;
    href: string;
}

export default function Navbar() {
    const t = useTranslations("navbar");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const router = useRouter();
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const locale = useLocale();

    const NAVBAR: NavbarItem[] = [
        { title: t("resources"), href: "" },
        { title: t("findProfile"), href: "/login" },
        { title: t("candidates"), href: "/login" },
    ];

    const handleNavigation = (href: string) => {
        if (href) {
            router.push(href);
            setActiveDropdown(null);
            setIsMobileMenuOpen(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobileMenuOpen]);

    return (
        <>
            <header className={`fixed w-full z-50 bg-white dark:bg-neutral-900 dark:border-zinc-600 border-b-2 border-b-zinc-400 px-5 ${orbitron.className}`} >
                <nav className="relative w-full" onMouseLeave={() => setActiveDropdown(null)}>

                    <div className="w-full flex items-center justify-between px-3 sm:px-4 lg:px-6 h-14 sm:h-16 lg:h-19">


                        <div className="flex items-center gap-x-2 sm:gap-x-3">
                            <Link href="/" className="flex items-center justify-center shrink-0">
                                <Image
                                    src={Lg}
                                    alt="Logo"
                                    width={70}
                                    height={70}
                                    priority
                                    className="dark:invert w-15 sm:w-20 lg:w-25 h-auto"
                                />
                            </Link>
                            <div className="hidden md:flex items-center gap-1">
                                {NAVBAR.map((item, index) => (
                                    <div key={index} className="relative">
                                        <button
                                            onMouseEnter={() => setActiveDropdown(index)}
                                            onClick={() => handleNavigation(item.href)}
                                            className={`
                                                flex items-center gap-1 px-2 lg:px-3 py-2
                                                text-xs lg:text-sm rounded-md font-bold
                                                transition-colors duration-150 cursor-pointer ${orbitron.className}
                                                ${activeDropdown === index
                                                    ? 'text-[#432dd7]'
                                                    : 'text-black dark:text-zinc-100 hover:text-[#432dd7]'
                                                }
                                            `}
                                        >
                                            {item.title}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-1.5 lg:gap-3">
                        <LightNightComponent />
                        <TranslateFunction defaultValue={locale} label="Changer de langue" />

                            <button
                                onClick={() => handleNavigation('/register')}
                                className={`flex items-center justify-center gap-1.5 px-2.5 lg:px-4 py-1.5 lg:py-2
                                           text-[11px] lg:text-sm font-bold whitespace-nowrap
                                           text-white bg-[#432dd7] rounded-lg hover:bg-[#442dd7b6]
                                           transition-colors cursor-pointer ${orbitron.className}`}
                            >
                                {t("findProfileBtn")}
                            </button>
                            <button
                                onClick={() => handleNavigation('/register')}
                                className={`hidden lg:flex items-center justify-center gap-1.5 px-4 py-2
                                           text-sm font-bold whitespace-nowrap
                                           border-2 border-[#432dd7] rounded-lg text-black dark:text-white
                                           transition-colors cursor-pointer ${orbitron.className}`}
                            >
                                {t("findProfileBtn2")}
                            </button>



                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden flex items-center justify-center min-w-11 min-h-11 text-black dark:text-white"
                                aria-label="Menu"
                            >
                                {isMobileMenuOpen ? <XIcon size={22} /> : <List size={22} />}
                            </button>
                        </div>
                        <div className="flex md:hidden items-center gap-1 sm:gap-2">

                            <div className="scale-75 sm:scale-90 origin-center">
                                <TranslateFunction defaultValue={locale} label="" />
                            </div>

                            <LightNightComponent />

                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="flex items-center justify-center min-w-11 min-h-11 text-black dark:text-white"
                                aria-label="Menu"
                            >
                                {isMobileMenuOpen ? <XIcon size={22} /> : <List size={22} />}
                            </button>
                        </div>
                    </div>
                </nav>
            </header>

            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                    <div
                        className="absolute top-14 sm:top-16 right-0 w-[85%] max-w-87.5 sm:max-w-sm
                                    h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)]
                                    bg-white dark:bg-neutral-900 shadow-2xl overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col p-4 sm:p-6 gap-4">
                            <nav className="flex flex-col gap-1">
                                {NAVBAR.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleNavigation(item.href)}
                                        className={`w-full text-left px-4 py-3 text-sm font-bold
                                        text-black dark:text-white hover:text-[#432dd7]
                                        hover:bg-zinc-100 dark:hover:bg-zinc-800
                                        rounded-lg transition-colors ${orbitron.className}`}
                                    >
                                        {item.title}
                                    </button>
                                ))}
                            </nav>
                            <div className="border-t border-zinc-200 dark:border-zinc-700" />
                            <button
                                onClick={() => handleNavigation('/login')}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3
                                text-sm font-bold text-white bg-[#432dd7]
                                rounded-lg hover:bg-[#442dd7b6] transition-colors ${orbitron.className}`}
                            >
                                <SignIn size={18} />
                                {t("findProfileBtn")}
                            </button>

                            
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}