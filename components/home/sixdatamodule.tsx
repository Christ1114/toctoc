'use client';
import { useEffect, useState } from 'react';
import AnnouncementCard from '@/components/lib/AnnouncementCard';
import { orbitron } from '@/fonts/font';
import { useTranslations } from 'next-intl';

export default function SixDataModuleHome() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <main className="w-full max-w-6xl mx-auto">
        <div className="flex items-center between gap-x-3 mb-5">
        <h1 className={`mb-1 text-[15px] font-bold text-stone-800 ${orbitron.className} `}>{t("title")}</h1>
      <p className={` text-sm text-black`}>
        {t("description")}
      </p>
        </div>
    
      <div className="overflow-hidden w-full max-w-6xl border-4 border-[#432dd7] bg-white shadow-sm">
        {loading && <p className="p-6 text-center text-stone-400">Chargement…</p>}
        {!loading && announcements.length === 0 && (
          <p className={`p-6 text-center text-stone-400`}>Aucune offre pour le moment.</p>
        )}
        {!loading && announcements.map((a) => (
          <AnnouncementCard key={a.id} announcement={a} />
        ))}
      </div>
    </main>
  );
}