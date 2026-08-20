// app/not-found.js (racine - PAS de 'use client')
import { getTranslations } from 'next-intl/server';
import { orbitron } from '@/fonts/font';
import { Home, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import Img from "@/public/assets/pictures/masquote_404.png";

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <div className="min-h-screen py-4 sm:py-6 md:py-8 lg:py-10 px-3 sm:px-4 md:px-6 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto">
        <div 
          className={`w-full mx-auto pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-8 px-3 sm:px-6 md:px-8 lg:px-10 text-black dark:text-zinc-300 rounded-lg ${orbitron.className}`}
        >
          <div className="mb-4 sm:mb-6 md:mb-8 text-center">
            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 mx-auto mb-2 sm:mb-3 md:mb-4">
              <Image 
                src={Img} 
                alt="404" 
                width={224} 
                height={224}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-[#432dd7] to-[#554c8f] bg-clip-text text-transparent">
              404
            </h1>
            
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mt-2">
              {t('title')}
            </h2>
            
            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-zinc-500 dark:text-zinc-400 mt-1">
              {t('description')}
            </p>
          </div>

          <div className="mb-4 sm:mb-5 md:mb-6 flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 md:p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] sm:text-xs md:text-sm text-blue-800 dark:text-blue-300">
              {t('info')}
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            <Link 
              href="/"
              className="w-full bg-[#432dd7] hover:bg-[#554c8f] text-white font-bold text-[10px] sm:text-xs md:text-sm px-6 py-2.5 sm:py-3 transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 rounded-md shadow-md hover:shadow-lg active:scale-98"
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {t('backHome')}
            </Link>
          </div>

          <div className="mt-4 sm:mt-5 md:mt-6 text-center">
            <Link 
              href="/login" 
              className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-[#432dd7] font-bold hover:underline hover:underline-offset-2 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {t('backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}