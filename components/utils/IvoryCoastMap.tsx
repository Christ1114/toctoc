'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { orbitron } from '@/fonts/font';


type CategoryKey =
  | 'NOUNOU'
  | 'MENAGERE'
  | 'CUISINIER'
  | 'CHAUFFEUR'
  | 'JARDINIER'
  | 'GARDIEN'
  | 'AIDE_PERSONNE_AGEE'
  | 'MAJORDOME';

type RegionPoint = {
  name: string;
  lat: number;
  lng: number;
  byCategory?: Partial<Record<CategoryKey, number>>;
  total?: number;
};
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  'Abidjan': { lat: 5.36, lng: -4.008 },
  'Bouaké': { lat: 7.69, lng: -5.03 },
  'Yamoussoukro': { lat: 6.82, lng: -5.28 },
  'San Pedro': { lat: 4.75, lng: -6.63 },
  'San Pédro': { lat: 4.75, lng: -6.63 },
  'Korhogo': { lat: 9.45, lng: -5.63 },
  'Daloa': { lat: 6.88, lng: -6.45 },
  'Man': { lat: 7.41, lng: -7.55 },
  'Abengourou': { lat: 6.73, lng: -3.49 },
  'Gagnoa': { lat: 6.13, lng: -5.93 },
  'Aboisso': { lat: 5.47, lng: -3.21 },
  'Dabou': { lat: 5.32, lng: -4.38 },
  'Grand-Bassam': { lat: 5.20, lng: -3.73 },
  'Yopougon': { lat: 5.35, lng: -4.07 },
  'Marcory': { lat: 5.30, lng: -3.98 },
  'Treichville': { lat: 5.30, lng: -4.01 },
  'Cocody': { lat: 5.36, lng: -4.01 },
  'Plateau': { lat: 5.32, lng: -4.02 },
  'Angré': { lat: 5.38, lng: -3.99 },
};
const MapComponent = dynamic(
  () => import('./MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black/20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
          <span className="text-white/60 text-xs sm:text-sm">Chargement...</span>
        </div>
      </div>
    )
  }
);


export default function IvoryCoastMap() {
  const t = useTranslations("mapComponent");
  const locale = useLocale();
  const [isMounted, setIsMounted] = useState(false);
  const [regions, setRegions] = useState<RegionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/announcements/map');
        const result = await response.json();

        if (result.success && result.data?.points) {
          const mappedRegions: RegionPoint[] = result.data.points
            .filter((point: any) => point.city && cityCoordinates[point.city])
            .map((point: any) => {
              const coords = cityCoordinates[point.city];
              return {
                name: point.city,
                lat: coords.lat,
                lng: coords.lng,
                total: point.count,
              };
            });

          setRegions(mappedRegions);
        }
      } catch (error) {
        console.error('Erreur chargement:', error);
      } finally {
        setLoading(false);
      }
    }

    if (isMounted) fetchData();
  }, [isMounted]);

  return (
    <section className={`w-full lg:-translate-y-10 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 lg:py-12 xl:py-14 ${orbitron.className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-2 sm:mb-2 lg:mb-2 xl:mb-3">
          <h2 className="text-lg mb-5 sm:text-xl lg:text-2xl xl:text-3xl font-bold text-neutral-950 dark:text-white">
            {t("title")}
          </h2>
          <p className="text-xs sm:text-sm xl:text-base text-white/60 mt-1 sm:mt-2">
            {loading
              ? t("loading")
              : ``}
          </p>
        </div>

        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl
                        h-87.5 
                        sm:h-112.5
                        lg:h-137.5 
                        xl:h-150 
                        transition-all duration-300">
          
          {!isMounted || loading ? (
            <div className="w-full h-full flex items-center justify-center bg-black/20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                <span className="text-white/60 text-xs sm:text-sm">
                  {loading ? t("loadingData") : t("loading")}
                </span>
              </div>
            </div>
          ) : (
            <MapComponent regions={regions} />
          )}
        </div>
      </div>
    </section>
  );
}