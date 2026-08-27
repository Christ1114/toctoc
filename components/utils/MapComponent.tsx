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
  byCategory?: Partial<Record<CategoryKey, number>>;
  total?: number; 
};


function jitterAround(lat: number, lng: number, index: number, total: number, radiusDeg = 0.04) {
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

  const allCounts = regions.flatMap((r) => {
    if (r.byCategory) return Object.values(r.byCategory);
    if (r.total) return [r.total];
    return [];
  });
  const globalMax = Math.max(...allCounts, 1);

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
      <div className="w-full h-full rounded-3xl bg-black/20 flex items-center justify-center">
        <div className="text-white/60">{t("loading")}</div>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } = MapComponents;
  const getRadius = (count: number) => {
    const minRadius = 6;
    const maxRadius = 22;
    return minRadius + (count / globalMax) * (maxRadius - minRadius);
  };


  return (
    
    <div ref={mapContainerRef} className="w-full h-full rounded-3xl overflow-hidden border border-white/10 relative">
  
      <style jsx global>{`
        .pulse-point {
          animation: pulse-glow 1.4s ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%, 100% {
            filter: drop-shadow(0 0 3px currentColor);
            opacity: 0.7;
          }
          50% {
            filter: drop-shadow(0 0 12px currentColor) drop-shadow(0 0 24px currentColor);
            opacity: 1;
          }
        }
        .pulse-point-strong {
          animation: pulse-glow-strong 0.8s ease-in-out infinite;
        }
        @keyframes pulse-glow-strong {
          0%, 100% {
            filter: drop-shadow(0 0 5px currentColor) drop-shadow(0 0 15px currentColor);
            opacity: 0.8;
          }
          50% {
            filter: drop-shadow(0 0 20px currentColor) drop-shadow(0 0 40px currentColor);
            opacity: 1;
          }
        }
        .dark-osm-tiles {
          filter: invert(1) hue-rotate(180deg) brightness(0.85) contrast(0.9) saturate(0.6);
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-osm-tiles"
        />

        {regions.map((region) => {
          const hasCategories = region.byCategory && Object.keys(region.byCategory).length > 0;

          if (hasCategories) {
            
            const entries = Object.entries(region.byCategory!) as [CategoryKey, number][];

            return entries.map(([category, count], i) => {
              const pos = jitterAround(region.lat, region.lng, i, entries.length);
              const radius = getRadius(count);
              const color = CATEGORY_COLORS[category];
              const isStrong = count > globalMax * 0.5;

              return (
                <CircleMarker
                  key={`${region.name}-${category}`}
                  center={[pos.lat, pos.lng]}
                  radius={radius}
                  pathOptions={{
                    color: 'transparent',
                    fillColor: color,
                    fillOpacity: 0.85,
                    weight: 0,
                  }}
                  className={isStrong ? 'pulse-point-strong' : 'pulse-point'}
                  style={{ color: color }}
                >
                  <Tooltip direction="top" offset={[0, -radius - 4]}>
                    <div className="text-center">
                      <p className="font-bold">{region.name}</p>
                      <p>{t(`categories.${category}`)} : <strong>{count.toLocaleString('fr-FR')}</strong></p>
                    </div>
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
          } else if (region.total) {
            
            const radius = getRadius(region.total);
            const isStrong = region.total > globalMax * 0.5;
            const color = '#F5C542';

            return (
              <CircleMarker
                key={`${region.name}-total`}
                center={[region.lat, region.lng]}
                radius={radius}
                pathOptions={{
                  color: 'transparent',
                  fillColor: color,
                  fillOpacity: 0.85,
                  weight: 0,
                }}
                className={isStrong ? 'pulse-point-strong' : 'pulse-point'}
                style={{ color: color }}
              >
              </CircleMarker>
            );
          }

          return null;
        })} 
      </MapContainer>
      <div className="absolute bottom-3 left-3 z-20 flex flex-wrap gap-2 rounded-xl bg-black/60 px-3 py-2 backdrop-blur-sm">
        {(Object.keys(CATEGORY_COLORS) as CategoryKey[]).map((cat) => (
          <span key={cat} className="flex items-center gap-1.5 text-xs text-white/80">
            <span
              className="h-2.5 w-2.5 rounded-full animate-pulse"
              style={{
                background: CATEGORY_COLORS[cat],
                boxShadow: `0 0 8px ${CATEGORY_COLORS[cat]}`,
              }}
            />
            {t(`categories.${cat}`)}
          </span>
        ))}
      </div>
    </div>
  );
}