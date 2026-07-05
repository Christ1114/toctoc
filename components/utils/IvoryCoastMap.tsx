'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

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
  byCategory: Partial<Record<CategoryKey, number>>;
};

const regions: RegionPoint[] = [
  { name: 'Abidjan', lat: 5.36, lng: -4.008, byCategory: { NOUNOU: 1800, MENAGERE: 1500, CUISINIER: 600, GARDIEN: 970 } },
  { name: 'Bouaké', lat: 7.69, lng: -5.03, byCategory: { NOUNOU: 500, MENAGERE: 480, CHAUFFEUR: 260 } },
  { name: 'Yamoussoukro', lat: 6.82, lng: -5.28, byCategory: { NOUNOU: 340, MENAGERE: 350, JARDINIER: 200 } },
  { name: 'San Pédro', lat: 4.75, lng: -6.63, byCategory: { NOUNOU: 260, MENAGERE: 250, GARDIEN: 160 } },
  { name: 'Korhogo', lat: 9.45, lng: -5.63, byCategory: { NOUNOU: 180, MENAGERE: 170, CUISINIER: 100 } },
];

const MapComponent = dynamic(
  () => import('./MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-112 rounded-3xl bg-black/20 flex items-center justify-center">
        <div className="text-white/60">Chargement de la carte...</div>
      </div>
    )
  }
);

export default function IvoryCoastMap() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-112 rounded-3xl bg-black/20 flex items-center justify-center">
        <div className="text-white/60">Chargement de la carte...</div>
      </div>
    );
  }

  return <MapComponent regions={regions} />;
}