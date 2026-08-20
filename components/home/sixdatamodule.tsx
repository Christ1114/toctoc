'use client';
import { useEffect, useState } from 'react';
import AnnouncementCard from '@/components/lib/AnnouncementCard';
import { orbitron } from '@/fonts/font';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function SixDataModuleHome() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount] = useState(4);
  const t = useTranslations("announcementCard");

  useEffect(() => {
    fetch('/api/announcements?limit=30')
      .then((r) => r.json())
      .then((data) => {
        console.log('Annonces chargées:', data.announcements?.length);
        setAnnouncements(data.announcements ?? []);
      })
      .catch((error) => {
        console.error('Erreur:', error);
        setAnnouncements([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleAnnouncements = announcements.slice(0, visibleCount);
  const hasMore = visibleCount < announcements.length;

  return (
    <main id="announcements-section" className="w-full min-h-150 max-w-full sm:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">

      <div className="flex items-center justify-center mb-4 xl:mb-6">
        <h1 className={`font-bold text-black dark:text-white w-full text-lg sm:text-xl lg:text-2xl xl:text-3xl text-center
                        ${orbitron.className}`}>
          {t("title")}
        </h1>
      </div>
      <div className="overflow-hidden w-full 
                      border-2 sm:border-3 lg:border-4 
                      border-[#432dd7] 
                      bg-white dark:bg-stone-900 
                      shadow-sm sm:shadow-md
                      rounded-lg sm:rounded-xl
                      transition-all duration-300">

        
        {loading && (
          <div className="flex items-center justify-center gap-3 p-6 sm:p-8 lg:p-10 xl:p-12">
            <div className="w-5 h-5 sm:w-6 sm:h-6 xl:w-7 xl:h-7 border-2 border-[#432dd7]/30 border-t-[#432dd7] rounded-full animate-spin" />
            <p className="text-stone-500 text-sm sm:text-base xl:text-lg">{t("loading")}</p>
          </div>
        )}

      
        {!loading && announcements.length === 0 && (
          <p className="p-6 sm:p-8 lg:p-10 xl:p-12 text-center text-stone-500 text-sm sm:text-base xl:text-lg">
            {t("nooffer")}
          </p>
        )}

        {!loading && visibleAnnouncements.map((a) => (
          <div
            key={a.id}
            className="border-b border-stone-200 dark:border-stone-700 last:border-b-0
                       min-h-24 sm:min-h-28 lg:min-h-32 xl:min-h-36
                       flex items-center"
          >
            <AnnouncementCard announcement={a} />
          </div>
        ))}
      </div>

     
      {!loading && announcements.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between 
                        mt-3 sm:mt-5 xl:mt-6 px-1 gap-3 sm:gap-0">
          
          <p className="text-xs sm:text-sm xl:text-base text-stone-500 dark:text-stone-400 font-medium">
            {visibleCount} / {announcements.length}{announcements.length > 1 ? 's' : ''}
          </p>

          <div className="flex gap-2 sm:gap-3 xl:gap-4">
            {hasMore && (
              <Link
                href="/login"
                className="text-xs sm:text-sm xl:text-base font-semibold
                           px-4 py-2 sm:px-5 sm:py-2.5 xl:px-6 xl:py-3
                           rounded-lg
                           bg-[#432dd7] hover:bg-[#432dd7]/90
                           text-white
                           shadow-md shadow-[#432dd7]/20
                           transition-all duration-300
                           hover:scale-105 active:scale-95
                           inline-flex items-center gap-2"
              >
                <span className={`${orbitron.className} antialiased`}>{t("morelesse")}</span>
                <svg className="w-4 h-4 xl:w-5 xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}