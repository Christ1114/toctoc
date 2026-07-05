'use client';
import { useEffect, useState } from 'react';
import AnnouncementCard from '@/components/lib/AnnouncementCard';
import { orbitron } from '@/fonts/font';
import ProfileCard from '../lib/ProfilCard';
import { useTranslations } from 'next-intl';

export default function SevenDataModuleHome() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("profileCard");

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
    <main className="w-full max-w-6xl mx-auto -translate-x-10">
        <div className="flex items-center justify-center  gap-x-3 mb-5">
        <h1 className={`mb-1 text-[15px]  text-center font-bold text-stone-800 ${orbitron.className} `}>{t("title")}</h1>
        </div>
    
      <div className="overflow-hidden w-full max-w-6xl  bg-white shadow-sm">
        {loading && <p className="p-6 text-center text-stone-400">Loading…</p>}
        {!loading && announcements.length === 0 && (
          <p className={`p-6 text-center text-stone-400`}>Aucun profil pour le moment.</p>
        )}
        {!loading && announcements.map((a) => (
          <ProfileCard key={a.id} profile={a} />
        ))}
      </div>
    </main>
  );
}