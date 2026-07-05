'use client';

import { useEffect, useRef, useState } from 'react';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useTranslations } from 'next-intl';

let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const IVORY_COAST_BOUNDS: LatLngBoundsExpression = [
  [4.1, -8.6],
  [10.8, -2.5],
];

type CategoryKey =
  | 'NOUNOU'
  | 'MENAGERE'
  | 'CUISINIER'
  | 'CHAUFFEUR'
  | 'JARDINIER'
  | 'GARDIEN'
  | 'AIDE_PERSONNE_AGEE'
  | 'MAJORDOME';

const CATEGORY_COLORS: Record<CategoryKey, string> = {
  NOUNOU: '#F5C542',
  MENAGERE: '#2F7A4F',
  CUISINIER: '#C1502E',
  CHAUFFEUR: '#3E7CB1',
  JARDINIER: '#6B8E23',
  GARDIEN: '#8B5FBF',
  AIDE_PERSONNE_AGEE: '#D1637A',
  MAJORDOME: '#C9A227',
};

type RegionPoint = {
  name: string;
  lat: number;
  lng: number;
  byCategory: Partial<Record<CategoryKey, number>>;
};

function jitterAround(lat: number, lng: number, index: number, total: number, radiusDeg = 0.06) {
  if (total <= 1) return { lat, lng };
  const angle = (2 * Math.PI * index) / total;
  return {
    lat: lat + radiusDeg * Math.sin(angle),
    lng: lng + radiusDeg * Math.cos(angle),
  };
}

interface MapComponentProps {
  regions: RegionPoint[];
}

export default function MapComponent({ regions }: MapComponentProps) {
  const t = useTranslations("mapComponent");
  const [isClient, setIsClient] = useState(false);
  const [pulseTick, setPulseTick] = useState(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!isClient) return;
    const id = setInterval(() => setPulseTick((t) => t + 1), 1400);
    return () => clearInterval(id);
  }, [isClient]);
  
  const [MapComponents, setMapComponents] = useState<{
    MapContainer: any;
    TileLayer: any;
    CircleMarker: any;
    Popup: any;
    Tooltip: any;
  } | null>(null);

  useEffect(() => {
    if (!isClient) return;
    
    const loadMap = async () => {
      const { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } = await import('react-leaflet');
      setMapComponents({ MapContainer, TileLayer, CircleMarker, Popup, Tooltip });
    };
    
    loadMap();
  }, [isClient]);

  if (!isClient || !MapComponents) {
    return (
      <div className="w-full h-112 rounded-3xl bg-black/20 flex items-center justify-center">
        <div className="text-white/60">{t("loading")}</div>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } = MapComponents;

  return (
    <div ref={mapContainerRef} className="w-full h-112 rounded-3xl overflow-hidden border border-white/10 relative">
      <style jsx global>{`
        .glow-marker {
          animation: glow-pulse 1.4s ease-in-out infinite;
        }
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 2px currentColor); opacity: 0.85; }
          50% { filter: drop-shadow(0 0 8px currentColor); opacity: 1; }
        }
      `}</style>

      <MapContainer
        center={[7.5, -5.5]}
        zoom={7}
        minZoom={6}
        maxZoom={10}
        maxBounds={IVORY_COAST_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%', background: '#17120D' }}
        className="z-10"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors, &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {regions.map((region) => {
          const entries = Object.entries(region.byCategory) as [CategoryKey, number][];
          const maxCount = Math.max(...entries.map(([, c]) => c), 1);

          return entries.map(([category, count], i) => {
            const pos = jitterAround(region.lat, region.lng, i, entries.length);
            const radius = 6 + (count / maxCount) * 10;
            const color = CATEGORY_COLORS[category];

            return (
              <CircleMarker
                key={`${region.name}-${category}`}
                center={[pos.lat, pos.lng]}
                radius={radius}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.75,
                  weight: 1,
                }}
                className="glow-marker"
              >
                <Tooltip direction="top" offset={[0, -radius]}>
                  {region.name} — {t(`categories.${category}`)}
                </Tooltip>
                <Popup>
                  <div className="text-center">
                    <h3 className="font-bold text-lg">{region.name}</h3>
                    <p style={{ color }} className="text-xl font-semibold">
                      {t(`categories.${category}`)} : {count.toLocaleString('fr-FR')}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          });
        })}
      </MapContainer>
      <div className="absolute bottom-3 left-3 z-20 flex flex-wrap gap-2 rounded-xl bg-black/60 px-3 py-2 backdrop-blur-sm">
        {(Object.keys(CATEGORY_COLORS) as CategoryKey[]).map((cat) => (
          <span key={cat} className="flex items-center gap-1.5 text-xs text-white/80">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: CATEGORY_COLORS[cat], boxShadow: `0 0 6px ${CATEGORY_COLORS[cat]}` }}
            />
            {t(`categories.${cat}`)}
          </span>
        ))}
      </div>
    </div>
  );
}