"use client";
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from "next/image";
import Lg from "../../../public/assets/logo/logo.svg";
import { orbitron } from '@/fonts/font';
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import LightNightComponent from "../light-night/lightNight";
import { useLocale, useTranslations } from 'next-intl';
import TranslateFunction from '../translate/translateFunction';

interface NavbarItem {
    title: string;
    href: string;
}

export default function Navbar() {
    const t = useTranslations("navbar");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const router = useRouter();
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const locale = useLocale();

    const NAVBAR: NavbarItem[] = [
        { title: t("resources"), href: "" },
        { title: t("findProfile"), href: "" },
        { title: t("candidates"), href: "" },
        
    ];

    const handleNavigation = (href: string) => {
        if (href) {
            router.push(href);
            setActiveDropdown(null);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsSearchOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    useEffect(() => {
        if (isSearchOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isSearchOpen]);

    return (
        <>
            <header className={`fixed w-full z-50 bg-white dark:bg-neutral-900 dark:border-zinc-600 border-b-2 border-b-zinc-400 ${orbitron.className}`}>
                <nav
                    className="relative w-full"
                    onMouseLeave={() => setActiveDropdown(null)}
                >
                    <div className="w-full flex items-center justify-between px-6 h-19">
                        <div className="flex items-center gap-x-3">
                            <Link href="/" className="flex items-center justify-center">
                                <Image
                                    src={Lg}
                                    alt="Logo"
                                    width={100}
                                    height={100}
                                    priority
                                    className="dark:invert"
                                />
                            </Link>

                            <div className="flex items-center gap-1">
                                {NAVBAR.map((item, index) => (
                                    <div key={index} className="relative">
                                        <button
                                            onMouseEnter={() => setActiveDropdown(index)}
                                            className={`
                                                flex items-center gap-1 px-3 py-2 text-sm rounded-md font-bold
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

                      
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleNavigation('/register')}
                                className={`
                                    flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold
                                    text-white bg-[#432dd7] rounded-lg hover:bg-[#442dd7b6]
                                    transition-colors cursor-pointer ${orbitron.className}
                                `}
                            >
                                {t("findProfileBtn")}
                            </button>

                            <button
                                onClick={() => handleNavigation('/register')}
                                className={`
                                    flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold
                                    border-2 border-[#432dd7] rounded-lg text-black dark:text-white
                                    transition-colors cursor-pointer ${orbitron.className}
                                `}
                            >
                                {t("findProfileBtn2")}
                            </button>

                            <LightNightComponent />
                            <TranslateFunction defaultValue={locale} label="Changer de langue" />

                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="flex items-center text-black cursor-pointer dark:text-white dark:hover:text-zinc-500"
                            >
                                <MagnifyingGlassIcon size={25} />
                            </button>
                        </div>

                    </div>
                </nav>
            </header>
            {isSearchOpen && (
                <div
                    className="fixed inset-0 z-100 flex items-center justify-center"
                    style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => setIsSearchOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 border-2 border-[#432dd7] rounded-xl px-4 py-3">
                            <MagnifyingGlassIcon
                                size={22}
                                className="text-[#432dd7] shrink-0"
                            />
                            <input
                                autoFocus
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t("search.placeholder")}
                                className={`
                                    flex-1 bg-transparent outline-none text-base
                                    text-black dark:text-white placeholder:text-zinc-400
                                    ${orbitron.className}
                                `}
                            />
                            <button
                                onClick={() => setIsSearchOpen(false)}
                                className="text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer transition-colors"
                            >
                                <XIcon size={20} />
                            </button>
                        </div>

                        <p className={`text-center text-xs text-zinc-400 mt-3 ${orbitron.className}`}>
                           <kbd className="bg-zinc-700 text-white px-2 py-0.5 rounded text-xs">Esc</kbd>
                        </p>
                    </div>
                   
                </div>
            )}
        </>
    );
}