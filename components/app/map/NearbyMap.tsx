"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSession } from "@/app/context/SessionContext";
import { useGeolocation } from "@/app/hooks/useGeolocation";
import { createAvatarMarkerElement } from "./AvatarMarker";
import TopToolbar, { type CityResult } from "./TopToolbar";
import AiSearchPanel from "./AiSearchPanel";
import { orbitron } from "@/fonts/font";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const STYLES = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
} as const;

const DEFAULT_CENTER: [number, number] = [2.3522, 48.8566];
const DEFAULT_ZOOM = 15;
const CITY_SEARCH_ZOOM = 12;
const DEFAULT_PITCH = 60;
const DEFAULT_BEARING = -17.6;

// Un user est considéré "en ligne" s'il a bougé/été actif dans les 5 dernières minutes
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

type NearbyUser = {
  id: string;
  name: string | null;
  image: string | null;
  accountType: string;
  providerType: string | null;
  clientType: string | null;
  bio: string | null;
  hourlyRate: string | null;
  currency: string;
  verificationLevel: string | null;
  verificationStatus: string;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastKnownRegion: string | null;
  lastLocationUpdatedAt: string | null;
};

export default function NearbyMap() {
  const t = useTranslations("NearbyMap");
  const tToolbar = useTranslations("TopToolbar");
  const { resolvedTheme } = useTheme();

  const { user } = useSession();

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const initialCenterRef = useRef<[number, number] | null>(null);
  const nearbyMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(null);
  const [loadingPosition, setLoadingPosition] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [aiSearchOpen, setAiSearchOpen] = useState(false);

  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const { latitude, longitude, error: geoError, requestLocation } = useGeolocation();

  // ─── Position initiale ───
  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const loadStoredPosition = async () => {
      try {
        const userData = user as any;
        const storedLat = userData?.lastLatitude;
        const storedLng = userData?.lastLongitude;

        if (storedLat && storedLng && isMounted) {
          const position: [number, number] = [storedLng, storedLat];
          initialCenterRef.current = position;
          setInitialCenter(position);
          setLoadingPosition(false);
        }
      } catch (err) {
        console.error("❌ Erreur lecture position stockée:", err);
      }

      if (isMounted && !initialCenterRef.current) {
        initialCenterRef.current = DEFAULT_CENTER;
        setInitialCenter(DEFAULT_CENTER);
        setLoadingPosition(false);
      }

      requestLocation();

      timeoutId = setTimeout(() => {
        if (isMounted && !initialCenterRef.current) {
          initialCenterRef.current = DEFAULT_CENTER;
          setInitialCenter(DEFAULT_CENTER);
          setLoadingPosition(false);
        }
      }, 10000);
    };

    loadStoredPosition();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [requestLocation, user]);

  useEffect(() => {
    if (latitude && longitude) {
      const position: [number, number] = [longitude, latitude];
      initialCenterRef.current = position;
      setInitialCenter(position);
      setLoadingPosition(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (geoError && !initialCenterRef.current) {
      initialCenterRef.current = DEFAULT_CENTER;
      setInitialCenter(DEFAULT_CENTER);
      setLoadingPosition(false);
    }
  }, [geoError]);

  // ─── Initialisation de la carte ───
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !initialCenter) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: STYLES.light,
        center: initialCenter,
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        bearing: DEFAULT_BEARING,
        attributionControl: {},
        maxPitch: 85,
        minZoom: 3,
        maxZoom: 20,
        canvasContextAttributes: {
          antialias: false,
        },
        fadeDuration: 100,
        refreshExpiredTiles: false,
      });

      mapRef.current = map;

      map.addControl(
        new maplibregl.NavigationControl({
          visualizePitch: true,
          showZoom: true,
          showCompass: true,
        }),
        "bottom-left"
      );

      map.dragRotate.enable();
      map.touchZoomRotate.enableRotation();

      map.on("error", () => {
        setMapError("Erreur de chargement de la carte");
      });

      map.on("load", () => {
        setMapLoaded(true);

        try {
          // ─── Marker de l'utilisateur connecté ───
          const me = user as any;
          const userMarkerEl = createAvatarMarkerElement({
            imageUrl: me?.image ?? null,
            fallbackLabel: me?.name ?? "?",
            color: "#432dd7",
            isOnline: true,
            bio: me?.bio ?? null,
            username: me?.name ?? null,
            lastSeenAt: new Date(),
          });

          userMarkerRef.current = new maplibregl.Marker({
            element: userMarkerEl,
            anchor: "bottom",
          })
            .setLngLat(initialCenter)
            .addTo(map);
        } catch (err) {
          console.error("Erreur création marker user:", err);
        }
      });
    } catch (err) {
      console.error("Erreur init map:", err);
      setMapError("Erreur d'initialisation de la carte");
    }
  }, [initialCenter, user]);

  // ─── Cleanup au démontage ───
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        userMarkerRef.current = null;
        nearbyMarkersRef.current = [];
        setMapLoaded(false);
      }
    };
  }, []);

  // ─── Recentrage ───
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !initialCenter) return;

    mapRef.current.flyTo({
      center: initialCenter,
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      bearing: DEFAULT_BEARING,
      essential: true,
      duration: 1200,
    });

    userMarkerRef.current?.setLngLat(initialCenter);
  }, [initialCenter, mapLoaded]);

  // ─── Fetch users proches ───
  const fetchNearby = useCallback(async (lng: number, lat: number) => {
    try {
      const res = await fetch(`/api/user/nearby?lat=${lat}&lng=${lng}&radius=20`);
      if (!res.ok) throw new Error("Erreur fetch nearby users");
      const data = await res.json();
      setNearbyUsers(data.users ?? []);
    } catch (err) {
      console.error("Erreur fetch nearby:", err);
      setNearbyUsers([]);
    }
  }, []);

  useEffect(() => {
    if (!initialCenter) return;
    const [lng, lat] = initialCenter;
    fetchNearby(lng, lat);
  }, [initialCenter, fetchNearby]);

  // ─── Affichage des markers des autres users ───
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Cleanup des anciens markers
    nearbyMarkersRef.current.forEach((m) => m.remove());
    nearbyMarkersRef.current = [];

    nearbyUsers.forEach((u) => {
      if (u.lastLatitude === null || u.lastLongitude === null) return;

      // Détermine si le user est en ligne (actif dans les 5 dernières minutes)
      const lastUpdate = u.lastLocationUpdatedAt
        ? new Date(u.lastLocationUpdatedAt)
        : null;
      const isOnline =
        lastUpdate !== null &&
        Date.now() - lastUpdate.getTime() < ONLINE_THRESHOLD_MS;

      const el = createAvatarMarkerElement({
        imageUrl: u.image,
        fallbackLabel: u.name ?? "?",
        color: u.accountType === "PROVIDER" ? "#2F7A4F" : "#432dd7",
        isOnline,
        bio: u.bio,
        username: u.name,
        lastSeenAt: lastUpdate,
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([u.lastLongitude, u.lastLatitude])
        .addTo(mapRef.current!);

      nearbyMarkersRef.current.push(marker);
    });

    return () => {
      nearbyMarkersRef.current.forEach((m) => m.remove());
      nearbyMarkersRef.current = [];
    };
  }, [nearbyUsers, mapLoaded]);

  // ─── Changement de thème clair/sombre ───
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const styleUrl = resolvedTheme === "dark" ? STYLES.dark : STYLES.light;
    try {
      mapRef.current.setStyle(styleUrl);
    } catch (err) {
      console.error("Erreur changement style:", err);
    }
  }, [resolvedTheme, mapLoaded]);

  const resetView = useCallback(() => {
    if (mapRef.current && initialCenter) {
      mapRef.current.flyTo({
        center: initialCenter,
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        bearing: DEFAULT_BEARING,
        essential: true,
        duration: 1000,
      });
    }
  }, [initialCenter]);

  const handleLocate = useCallback(() => {
    requestLocation();
    if (mapRef.current && initialCenter) {
      mapRef.current.flyTo({
        center: initialCenter,
        zoom: DEFAULT_ZOOM,
        duration: 1000,
        essential: true,
      });
    }
  }, [requestLocation, initialCenter]);

  const handleSelectCity = useCallback(
    (city: CityResult) => {
      if (!city.hasOffers || city.latitude == null || city.longitude == null) {
        setSearchMessage(tToolbar("noOffersInCity", { city: city.name }));
        return;
      }
      setSearchMessage(null);
      const position: [number, number] = [city.longitude, city.latitude];

      if (mapRef.current && mapLoaded) {
        mapRef.current.flyTo({
          center: position,
          zoom: CITY_SEARCH_ZOOM,
          pitch: DEFAULT_PITCH,
          bearing: DEFAULT_BEARING,
          essential: true,
          duration: 1200,
        });
      }
      fetchNearby(city.longitude, city.latitude);
    },
    [mapLoaded, fetchNearby, tToolbar]
  );

  return (
    <div
      className="relative w-full h-dvh md:h-full md:min-h-125 overflow-hidden"
      style={{
        minHeight: "500px",
      }}
    >
      <style jsx global>{`
        .maplibregl-ctrl-bottom-left {
          bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
          left: max(8px, env(safe-area-inset-left, 0px)) !important;
          transition: bottom 0.2s ease, left 0.2s ease;
        }

        @media (min-width: 640px) {
          .maplibregl-ctrl-bottom-left {
            bottom: calc(80px + env(safe-area-inset-bottom, 0px)) !important;
            left: 12px !important;
          }
        }

        @media (min-width: 768px) {
          .maplibregl-ctrl-bottom-left {
            bottom: 16px !important;
            left: 16px !important;
          }
        }

        @media (min-width: 1024px) {
          .maplibregl-ctrl-bottom-left {
            bottom: 20px !important;
            left: 20px !important;
          }
        }

        .maplibregl-ctrl-bottom-left .maplibregl-ctrl-group {
          border-radius: 12px !important;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18) !important;
          background: rgba(0, 0, 0, 0.62) !important;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .maplibregl-ctrl-bottom-left .maplibregl-ctrl-group button {
          width: 40px !important;
          height: 40px !important;
          background: transparent !important;
          color: white !important;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        @media (min-width: 640px) {
          .maplibregl-ctrl-bottom-left .maplibregl-ctrl-group button {
            width: 40px !important;
            height: 40px !important;
          }
        }

        @media (min-width: 768px) {
          .maplibregl-ctrl-bottom-left .maplibregl-ctrl-group button {
            width: 36px !important;
            height: 36px !important;
          }
        }

        @media (min-width: 1024px) {
          .maplibregl-ctrl-bottom-left .maplibregl-ctrl-group button {
            width: 40px !important;
            height: 40px !important;
          }
        }

        .maplibregl-ctrl-bottom-left .maplibregl-ctrl-icon {
          filter: invert(1) !important;
        }

        .maplibregl-ctrl-bottom-left .maplibregl-ctrl-group button + button {
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        .maplibregl-canvas {
          outline: none !important;
          touch-action: none;
        }

        .maplibregl-ctrl-attrib {
          font-size: 10px !important;
        }
      `}</style>
      {loadingPosition && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-gray-100 dark:bg-gray-900 transition-colors">
          <div className="flex flex-col items-center gap-3 px-4">
            <div className="animate-spin rounded-full h-9 w-9 border-2 border-gray-300 dark:border-gray-700 border-b-gray-900 dark:border-b-white" />
            <p
              className={`text-sm sm:text-base text-gray-600 dark:text-gray-300 text-center ${orbitron.className}`}
            >
              Chargement de la carte...
            </p>
          </div>
        </div>
      )}
      {mapError && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-red-100 dark:bg-red-900/80 text-red-700 dark:text-red-100 p-4 sm:p-5 rounded-xl shadow-lg max-w-[92vw] sm:max-w-sm border border-red-200 dark:border-red-800">
          <p className="text-sm sm:text-base">{mapError}</p>
          <button
            onClick={() => {
              setMapError(null);
              window.location.reload();
            }}
            className={`mt-3 text-sm underline hover:no-underline cursor-pointer ${orbitron.className}`}
          >
            {t("retry")}
          </button>
        </div>
      )}

      {/* ───── Carte ───── */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full bg-gray-200 dark:bg-gray-800"
      />

      <TopToolbar
        onOpenAiSearch={() => setAiSearchOpen(true)}
        onSelectCity={handleSelectCity}
        searchMessage={searchMessage}
      />

      <AiSearchPanel open={aiSearchOpen} onClose={() => setAiSearchOpen(false)} />
      <button
        onClick={resetView}
        aria-label="Réinitialiser la vue 3D"
        className={`
          absolute z-10 bg-black/60 hover:bg-black/75 active:bg-black/90
          backdrop-blur-sm text-white rounded-lg shadow-md cursor-pointer
          transition-all touch-manipulation select-none
          right-2 bottom-[calc(72px+env(safe-area-inset-bottom,0px))]
          text-xs px-2.5 h-9 min-w-9
          sm:right-3 sm:bottom-[calc(80px+env(safe-area-inset-bottom,0px))]
          sm:text-sm sm:px-3 sm:h-10 sm:min-w-10
          md:right-4 md:bottom-4 md:text-sm md:px-3 md:h-10
          lg:right-5 lg:bottom-5 lg:text-base lg:px-4 lg:h-11
          ${orbitron.className}
        `}
      >
        3D
      </button>
    </div>
  );
}