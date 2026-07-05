'use client';

import { orbitron } from '@/fonts/font';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { useTranslations } from 'next-intl';

type BtnProps = {
  title: string;
  href: string;
};
type GridProps = {
  id: number;
  title: string;
  icon: string;
  btn2: BtnProps;
};

export default function FourModuleHome() {
  const t = useTranslations("fourModuleHome");

  const Grid: GridProps[] = [
    {
      id: 1,
      title: t("items.0.title"),
      icon: '/icons/iconN.svg',
      btn2: { title: t("btnTocer"), href: '#' },
    },
    {
      id: 2,
      title: t("items.1.title"),
      icon: '/icons/iconN1.svg',
      btn2: { title: t("btnTocer"), href: '#' },
    },
    {
      id: 3,
      title: t("items.2.title"),
      icon: '/icons/iconN2.svg',
      btn2: { title: t("btnTocer"), href: '#' },
    },
    {
      id: 4,
      title: t("items.3.title"),
      icon: '/icons/iconN3.svg',
      btn2: { title: t("btnTocer"), href: '#' },
    },
    {
      id: 5,
      title: t("items.4.title"),
      icon: '/icons/iconN4.svg',
      btn2: { title: t("btnTocer"), href: '#' },
    },
    {
      id: 6,
      title: t("items.5.title"),
      icon: '/icons/iconN5.svg',
      btn2: { title: t("btnTocer"), href: '#' },
    },
  ];

  return (
    <div className="w-full max-w-5xl -translate-x-10 flex flex-col gap-8 p-6 box-border relative">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `
            linear-gradient(to right, #F5C542 1px, transparent 1px),
            linear-gradient(to bottom, #2F7A4F 1px, transparent 1px),
            linear-gradient(to right, #C1502E 1px, transparent 1px),
            linear-gradient(to bottom, #3E7CB1 1px, transparent 1px),
            linear-gradient(to right, #6B8E23 1px, transparent 1px),
            linear-gradient(to bottom, #8B5FBF 1px, transparent 1px),
            linear-gradient(to right, #D1637A 1px, transparent 1px),
            linear-gradient(to bottom, #C9A227 1px, transparent 1px)
          `,
          backgroundSize: `
            4rem 4rem,
            4rem 4rem,
            4rem 4rem,
            4rem 4rem,
            4rem 4rem,
            4rem 4rem,
            4rem 4rem,
            4rem 4rem
          `,
          backgroundPosition: `
            0 0,
            0 0,
            1rem 0,
            0 1rem,
            2rem 0,
            0 2rem,
            3rem 0,
            0 3rem
          `,
          maskImage:
            'radial-gradient(ellipse 80% 50% at 50% 0%, #000 70%, transparent 110%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 50% at 50% 0%, #000 70%, transparent 110%)',
          opacity: 0.15,
        }}
      />
      <div className="text-center -mb-2">
        <h2
          className={`text-xl font-bold text-zinc-700 ${orbitron.className} antialiased text-black dark:text-white `}
        >
          {t("title")}
        </h2>
      </div>
      {Grid.map((item, index) => (
        <div
          key={`service-${item.id}`}
          className="grid grid-cols-[350px_1fr] items-center gap-4 w-full group relative"
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <div className="absolute left-5 top-1/2 -translate-y-1/2 w-px h-full bg-linear-to-b from-transparent via-zinc-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="flex items-center gap-4 min-w-0 relative z-10 ">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-white/80 backdrop-blur-sm border border-zinc-200 shadow-lg shadow-zinc-500/10 flex items-center justify-center overflow-hidden group-hover:shadow-zinc-500/20 group-hover:scale-110 transition-all duration-300">
              <div className="absolute inset-0 bg-linear-to-br from-zinc-500/10 to-zinc-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Image
                src={item.icon}
                alt={item.title}
                width={22}
                height={22}
                className="object-contain relative z-10"
              />
            </div>
            <h6
              className={`text-xs w-24 leading-tight font-bold text-zinc-700  dark:text-white group-hover:text-zinc-900 transition-colors duration-300 ${orbitron.className} antialiased`}
            >
              {item.title}
            </h6>
          </div>
          <div className="flex items-center gap-3 justify-end min-w-5 relative z-10">
            <Link
              href={item.btn2.href}
              className="text-xs font-bold px-4 py-2 border-2 border-zinc-300 text-zinc-600 whitespace-nowrap backdrop-blur-sm bg-white/60 hover:bg-zinc-100 hover:border-zinc-400 hover:text-zinc-800 transition-all duration-300 flex items-center gap-1.5 group/btn2"
              aria-label={`${item.btn2.title} - ${item.title}`}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {item.btn2.title}
              <svg
                className="w-3 h-3 opacity-0 -translate-x-2 group-hover/btn2:opacity-100 group-hover/btn2:translate-x-0 transition-all duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}