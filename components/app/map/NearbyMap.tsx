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
import { useRouter } from "@/i18n/navigation";

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

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;
const NEARBY_RADIUS_KM = 20;
const FLY_DURATION_MS = 1200;
const INIT_TIMEOUT_MS = 10_000;

const PROVIDER_PATH = "/app/provider";
const CLIENT_PATH = "/app/client";

type NearbyUser = {
  id: string;
  name: string | null;
  image: string | null;
  accountType: "CLIENT" | "PROVIDER" | "ADMIN";
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

function getPublicProfilePath(user: NearbyUser): string | null {
  if (user.accountType === "PROVIDER") return `${PROVIDER_PATH}/${user.id}`;
  if (user.accountType === "CLIENT") return `${CLIENT_PATH}/${user.id}`;
  return null;
}

export default function NearbyMap() {
  const t = useTranslations("NearbyMap");
  const tToolbar = useTranslations("TopToolbar");
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const { user } = useSession();
  const { latitude, longitude, error: geoError, requestLocation } = useGeolocation();

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const nearbyMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const initialCenterRef = useRef<[number, number] | null>(null);
  const hasInitRef = useRef(false);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // ✅ Refs pour éviter les closures stale dans les handlers MapLibre
  const userRef = useRef(user);
  const routerRef = useRef(router);
  const labelsRef = useRef({
    online: t("online"),
    offline: t("offline"),
    justNow: t("justNow"),
    minutesAgo: (n: number) => t("minutesAgo", { n }),
    hoursAgo: (n: number) => t("hoursAgo", { n }),
    daysAgo: (n: number) => t("daysAgo", { n }),
  });

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { routerRef.current = router; }, [router]);
  useEffect(() => {
    labelsRef.current = {
      online: t("online"),
      offline: t("offline"),
      justNow: t("justNow"),
      minutesAgo: (n: number) => t("minutesAgo", { n }),
      hoursAgo: (n: number) => t("hoursAgo", { n }),
      daysAgo: (n: number) => t("daysAgo", { n }),
    };
  }, [t]);

  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(null);
  const [loadingPosition, setLoadingPosition] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [aiSearchOpen, setAiSearchOpen] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  /* ═══════════════════════════════════════════════════════
     POSITION INITIALE (une seule fois)
     ═══════════════════════════════════════════════════════ */
  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const u = userRef.current as any;
    const storedLat = u?.lastLatitude;
    const storedLng = u?.lastLongitude;

    if (storedLat && storedLng) {
      const pos: [number, number] = [storedLng, storedLat];
      initialCenterRef.current = pos;
      setInitialCenter(pos);
      setLoadingPosition(false);
    } else {
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
    }, INIT_TIMEOUT_MS);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!latitude || !longitude) return;
    const pos: [number, number] = [longitude, latitude];
    initialCenterRef.current = pos;
    setInitialCenter(pos);
    setLoadingPosition(false);
  }, [latitude, longitude]);

  useEffect(() => {
    if (geoError && !initialCenterRef.current) {
      initialCenterRef.current = DEFAULT_CENTER;
      setInitialCenter(DEFAULT_CENTER);
      setLoadingPosition(false);
    }
  }, [geoError]);

  /* ═══════════════════════════════════════════════════════
     INIT MAP (une seule fois)
     ═══════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !initialCenter) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: resolvedTheme === "dark" ? STYLES.dark : STYLES.light,
        center: initialCenter,
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        bearing: DEFAULT_BEARING,
        attributionControl: {},
        maxPitch: 85,
        minZoom: 3,
        maxZoom: 20,
        canvasContextAttributes: { antialias: false },
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

      map.on("error", (e: any) => {
        const msg = String(e?.error?.message ?? "");
        if (msg.includes("Failed to fetch") || msg.includes("AbortError")) return;
        console.error("Map error:", e);
      });

      map.once("load", () => {
        setMapLoaded(true);

        try {
          const me = userRef.current as any;

          const el = createAvatarMarkerElement({
            imageUrl: me?.image ?? null,
            fallbackLabel: me?.name ?? "?",
            color: "#432dd7",
            isOnline: true,
            bio: me?.bio ?? null,
            username: me?.name ?? null,
            lastSeenAt: new Date(),
            // ✅ Utilise userRef → pas de closure stale
           onClick: () => {
  const current = userRef.current as any;
  if (!current?.id) return;

  if (current.accountType === "PROVIDER") {
    routerRef.current.push(`/app/provider/${current.id}`);
  } else if (current.accountType === "CLIENT") {
    routerRef.current.push(`/app/client/${current.id}`);
  }
},
            labels: labelsRef.current,
          });

          // ✅ pointer-events explicite
          el.style.pointerEvents = "auto";
          el.style.cursor = "pointer";

          userMarkerRef.current = new maplibregl.Marker({
            element: el,
            anchor: "bottom",
          })
            .setLngLat(initialCenterRef.current ?? DEFAULT_CENTER)
            .addTo(map);
        } catch (err) {
          console.error("Erreur création marker user:", err);
        }
      });
    } catch (err) {
      console.error("Erreur init map:", err);
      setMapError("Erreur d'initialisation de la carte");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCenter]);

  /* ═══════════════════════════════════════════════════════
     CLEANUP GLOBAL (unmount)
     ═══════════════════════════════════════════════════════ */
  useEffect(() => {
    return () => {
      fetchAbortRef.current?.abort();
      nearbyMarkersRef.current.forEach((m) => m.remove());
      nearbyMarkersRef.current.clear();
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  /* ═══════════════════════════════════════════════════════
     RECENTRAGE
     ═══════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !initialCenter) return;

    mapRef.current.flyTo({
      center: initialCenter,
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      bearing: DEFAULT_BEARING,
      essential: true,
      duration: FLY_DURATION_MS,
    });

    userMarkerRef.current?.setLngLat(initialCenter);
  }, [initialCenter, mapLoaded]);

  /* ═══════════════════════════════════════════════════════
     FETCH NEARBY (avec AbortController)
     ═══════════════════════════════════════════════════════ */
  const fetchNearby = useCallback(async (lng: number, lat: number) => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    try {
      const res = await fetch(
        `/api/user/nearby?lat=${lat}&lng=${lng}&radius=${NEARBY_RADIUS_KM}`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      const list: NearbyUser[] = data.users ?? [];

      // ✅ Skip re-render si la liste est identique
      setNearbyUsers((prev) => {
        if (prev.length !== list.length) return list;
        for (let i = 0; i < list.length; i++) {
          if (prev[i]?.id !== list[i].id) return list;
          if (prev[i]?.lastLocationUpdatedAt !== list[i].lastLocationUpdatedAt)
            return list;
        }
        return prev;
      });
    } catch (err) {
      if ((err as any)?.name === "AbortError") return;
      console.error("Erreur fetch nearby:", err);
      setNearbyUsers([]);
    }
  }, []);

  useEffect(() => {
    if (!initialCenter) return;
    const [lng, lat] = initialCenter;
    fetchNearby(lng, lat);
  }, [initialCenter, fetchNearby]);

  /* ═══════════════════════════════════════════════════════
     MARKERS DES USERS PROCHES (diffing par id)
     ═══════════════════════════════════════════════════════ */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const current = nearbyMarkersRef.current;
    const seen = new Set<string>();

    nearbyUsers.forEach((nu) => {
      if (nu.lastLatitude == null || nu.lastLongitude == null) return;
      seen.add(nu.id);

      const lastUpdate = nu.lastLocationUpdatedAt
        ? new Date(nu.lastLocationUpdatedAt)
        : null;
      const isOnline =
        lastUpdate !== null &&
        Date.now() - lastUpdate.getTime() < ONLINE_THRESHOLD_MS;
      const profilePath = getPublicProfilePath(nu);

      // ✅ Marker déjà présent → update position uniquement
      const existing = current.get(nu.id);
      if (existing) {
        existing.setLngLat([nu.lastLongitude, nu.lastLatitude]);
        return;
      }

      const el = createAvatarMarkerElement({
        imageUrl: nu.image,
        fallbackLabel: nu.name ?? "?",
        color: nu.accountType === "PROVIDER" ? "#2F7A4F" : "#432dd7",
        isOnline,
        bio: nu.bio,
        username: nu.name,
        lastSeenAt: lastUpdate,
        onClick: profilePath
          ? () => routerRef.current.push(profilePath)
          : undefined,
        labels: labelsRef.current,
      });

      el.style.pointerEvents = "auto";
      if (profilePath) el.style.cursor = "pointer";

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([nu.lastLongitude, nu.lastLatitude])
        .addTo(map);

      current.set(nu.id, marker);
    });

    // ✅ Suppression des markers qui ne sont plus dans la liste
    current.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.remove();
        current.delete(id);
      }
    });
  }, [nearbyUsers, mapLoaded]);

  /* ═══════════════════════════════════════════════════════
     STYLE (light/dark)
     ═══════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const url = resolvedTheme === "dark" ? STYLES.dark : STYLES.light;
    try {
      mapRef.current.setStyle(url);
    } catch (err) {
      console.error("Erreur changement style:", err);
    }
  }, [resolvedTheme, mapLoaded]);

  /* ═══════════════════════════════════════════════════════
     HANDLERS UI
     ═══════════════════════════════════════════════════════ */
  const resetView = useCallback(() => {
    const map = mapRef.current;
    const center = initialCenterRef.current;
    if (!map || !center) return;
    map.flyTo({
      center,
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      bearing: DEFAULT_BEARING,
      essential: true,
      duration: 1000,
    });
  }, []);

  const handleLocate = useCallback(() => {
    requestLocation();
    const map = mapRef.current;
    const center = initialCenterRef.current;
    if (map && center) {
      map.flyTo({ center, zoom: DEFAULT_ZOOM, duration: 1000, essential: true });
    }
  }, [requestLocation]);

  const handleSelectCity = useCallback(
    (city: CityResult) => {
      if (!city.hasOffers || city.latitude == null || city.longitude == null) {
        setSearchMessage(tToolbar("noOffersInCity", { city: city.name }));
        return;
      }
      setSearchMessage(null);
      const position: [number, number] = [city.longitude, city.latitude];
      const map = mapRef.current;
      if (map && mapLoaded) {
        map.flyTo({
          center: position,
          zoom: CITY_SEARCH_ZOOM,
          pitch: DEFAULT_PITCH,
          bearing: DEFAULT_BEARING,
          essential: true,
          duration: FLY_DURATION_MS,
        });
      }
      fetchNearby(city.longitude, city.latitude);
    },
    [mapLoaded, fetchNearby, tToolbar]
  );

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  return (
    <div
      className="relative w-full h-dvh md:h-full md:min-h-125 overflow-hidden"
      style={{ minHeight: "500px" }}
    >
      <style jsx global>{`
        /* ✅ Les markers reçoivent les clics */
        .maplibregl-marker {
          pointer-events: auto !important;
        }
        .maplibregl-marker > * {
          pointer-events: auto;
        }

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
          .maplibregl-ctrl-bottom-left { bottom: 16px !important; left: 16px !important; }
        }
        @media (min-width: 1024px) {
          .maplibregl-ctrl-bottom-left { bottom: 20px !important; left: 20px !important; }
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
        @media (min-width: 768px) {
          .maplibregl-ctrl-bottom-left .maplibregl-ctrl-group button {
            width: 36px !important; height: 36px !important;
          }
        }
        @media (min-width: 1024px) {
          .maplibregl-ctrl-bottom-left .maplibregl-ctrl-group button {
            width: 40px !important; height: 40px !important;
          }
        }
        .maplibregl-ctrl-bottom-left .maplibregl-ctrl-icon { filter: invert(1) !important; }
        .maplibregl-ctrl-bottom-left .maplibregl-ctrl-group button + button {
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .maplibregl-canvas { outline: none !important; touch-action: none; }
        .maplibregl-ctrl-attrib { font-size: 10px !important; }
      `}</style>

      {loadingPosition && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-gray-100 dark:bg-gray-900 transition-colors">
          <div className="flex flex-col items-center gap-3 px-4">
            <div className="animate-spin rounded-full h-9 w-9 border-2 border-gray-300 dark:border-gray-700 border-b-gray-900 dark:border-b-white" />
            <p className={`text-sm sm:text-base text-gray-600 dark:text-gray-300 text-center ${orbitron.className}`}>
              {t("loading")}
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

      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full bg-gray-200 dark:bg-gray-800"
      />

      {/* ✅ TopToolbar : wrapper transparent, contenu cliquable */}
      <div className="absolute inset-x-0 top-0 z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <TopToolbar
            onOpenAiSearch={() => setAiSearchOpen(true)}
            onSelectCity={handleSelectCity}
            searchMessage={searchMessage}
          />
        </div>
      </div>

      {/* ✅ AiSearchPanel monté uniquement quand ouvert → ne bloque pas la carte */}
      {aiSearchOpen && (
        <AiSearchPanel
          open={aiSearchOpen}
          onClose={() => setAiSearchOpen(false)}
        />
      )}

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