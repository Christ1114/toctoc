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
    <div className="w-full flex flex-col relative">

      <div
        className="absolute inset-0 -z-10"
      />
      <div className="text-center mb-10">
        <h2 className={`font-bold text-black dark:text-white
                        text-sm sm:text-lg lg:text-xl xl:text-2xl
                        ${orbitron.className} antialiased`}>
          {t("title")}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2  xl:grid-cols-1 lg:grid-cols-1  gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
        {Grid.map((item, index) => (
          <Link
            key={`service-${item.id}`}
            href={item.btn2.href}
            aria-label={`${item.btn2.title} - ${item.title}`}
            className="flex items-center justify-between gap-2 sm:gap-3 lg:gap-4
                       w-full h-19 group relative
                       rounded-lg sm:rounded-xl
                       border-2 border-zinc-300
                       bg-white/60 backdrop-blur-sm
                       p-3 sm:p-4 lg:p-5 xl:p-6
                       cursor-pointer
                       hover:bg-zinc-100 hover:border-zinc-400
                       hover:shadow-md
                       active:scale-95
                       transition-all duration-300"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1 relative z-10">

              <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 xl:w-12 xl:h-12
                              shrink-0 rounded-lg sm:rounded-xl 
                              bg-white/80 backdrop-blur-sm 
                              border border-zinc-200 
                              shadow-md sm:shadow-lg shadow-zinc-500/10 
                              flex items-center justify-center overflow-hidden 
                              group-hover:shadow-zinc-500/20 
                              group-hover:scale-105 sm:group-hover:scale-110 
                              transition-all duration-300">
                <div className="absolute inset-0 bg-linear-to-br from-zinc-500/10 to-zinc-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Image
                  src={item.icon}
                  alt={item.title}
                  width={16}
                  height={16}
                  className="object-contain relative z-10
                             w-3.5 h-3.5 sm:w-5 sm:h-5 lg:w-5.5 lg:h-5.5 xl:w-6.5 xl:h-6.5"
                />
              </div>

              <h6 className={`font-bold text-zinc-700 dark:text-white 
                             group-hover:text-zinc-900 
                             transition-colors duration-300 
                             leading-tight
                             text-[11px] sm:text-xs lg:text-sm xl:text-base
                             min-w-0 flex-1
                             line-clamp-2
                             ${orbitron.className} antialiased`}>
                {item.title}
              </h6>
            </div>

            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 xl:w-5 xl:h-5
                         shrink-0 text-zinc-500
                         -translate-x-1
                         group-hover:translate-x-0 group-hover:text-zinc-800
                         transition-all duration-300 relative z-10"
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
        ))}
      </div>
    </div>
  );
}