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

// 👇 Types des users proches
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

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const loadStoredPosition = async () => {
      try {
        const userData = user as any;
        const storedLat = userData?.lastLatitude;
        const storedLng = userData?.lastLongitude;

        if (storedLat && storedLng && isMounted) {
          console.log("✅ Position stockée trouvée (affichage immédiat):", storedLat, storedLng);
          const position: [number, number] = [storedLng, storedLat];
          initialCenterRef.current = position;
          setInitialCenter(position);
          setLoadingPosition(false);
        }
      } catch (err) {
        console.error("❌ Erreur lecture position stockée:", err);
      }

      if (isMounted && !initialCenterRef.current) {
        console.log("📍 Utilisation de la position par défaut (Paris)");
        initialCenterRef.current = DEFAULT_CENTER;
        setInitialCenter(DEFAULT_CENTER);
        setLoadingPosition(false);
      }

      requestLocation();

      timeoutId = setTimeout(() => {
        if (isMounted && !initialCenterRef.current) {
          console.log("⚠️ Timeout géolocalisation, utilisation de Paris");
          initialCenterRef.current = DEFAULT_CENTER;
          setInitialCenter(DEFAULT_CENTER);
          setLoadingPosition(false);
        }
      }, 10000);
    };

    loadStoredPosition();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [requestLocation, user]);

  useEffect(() => {
    if (latitude && longitude) {
      console.log("✅ Position GPS obtenue:", latitude, longitude);
      const position: [number, number] = [longitude, latitude];
      initialCenterRef.current = position;
      setInitialCenter(position);
      setLoadingPosition(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (geoError && !initialCenterRef.current) {
      console.error("❌ Erreur géolocalisation:", geoError);
      initialCenterRef.current = DEFAULT_CENTER;
      setInitialCenter(DEFAULT_CENTER);
      setLoadingPosition(false);
    }
  }, [geoError]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !initialCenter) return;

    console.log("🗺️ Tentative d'initialisation de la carte");
    console.log("📍 Centre:", initialCenter);
    console.log("📦 Container:", mapContainer.current);

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
      });

      mapRef.current = map;

      // 👇 Contrôle zoom/dézoom/boussole placé en bas-gauche
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

      map.on("error", (e) => {
        console.error("❌ Erreur carte:", e);
        setMapError("Erreur de chargement de la carte");
      });

      map.on("style.load", () => {
        console.log("✅ Style chargé");
      });

      map.on("load", () => {
        console.log("✅ Carte chargée avec succès");
        setMapLoaded(true);

        try {
          const userMarkerEl = createAvatarMarkerElement({
            fallbackLabel: t("me"),
            color: "#432dd7",
          });

          userMarkerRef.current = new maplibregl.Marker({
            element: userMarkerEl,
            anchor: "bottom",
          })
            .setLngLat(initialCenter)
            .addTo(map);

          console.log("✅ Marqueur utilisateur ajouté");
        } catch (err) {
          console.error("❌ Erreur création marqueur:", err);
        }
      });
    } catch (err) {
      console.error("❌ Erreur initialisation carte:", err);
      setMapError("Erreur d'initialisation de la carte");
    }

    return () => {
      if (mapRef.current) {
        console.log("🗑️ Nettoyage carte");
        mapRef.current.remove();
        mapRef.current = null;
        userMarkerRef.current = null;
        setMapLoaded(false);
      }
    };
  }, [initialCenter, t]);

  // 🔄 Recentrer la carte sur la position du user quand elle change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !initialCenter) return;

    console.log("🎯 Recentrage carte sur:", initialCenter);

    mapRef.current.flyTo({
      center: initialCenter,
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      bearing: DEFAULT_BEARING,
      essential: true,
      duration: 1200,
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat(initialCenter);
    }
  }, [initialCenter, mapLoaded]);

  const fetchNearby = useCallback(async (lng: number, lat: number) => {
    try {
      console.log("🔍 Fetch nearby users...");
      const res = await fetch(`/api/user/nearby?lat=${lat}&lng=${lng}&radius=20`);
      if (!res.ok) throw new Error("Erreur fetch nearby users");
      const data = await res.json();
      console.log(`✅ ${data.users?.length ?? 0} users proches reçus`);
      setNearbyUsers(data.users ?? []);
    } catch (err) {
      console.error("❌ Erreur fetch nearby:", err);
      setNearbyUsers([]);
    }
  }, []);

  useEffect(() => {
    if (!initialCenter) return;
    const [lng, lat] = initialCenter;
    fetchNearby(lng, lat);
  }, [initialCenter, fetchNearby]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    nearbyMarkersRef.current.forEach((m) => m.remove());
    nearbyMarkersRef.current = [];
    nearbyUsers.forEach((user) => {
      if (user.lastLatitude === null || user.lastLongitude === null) return;

      const el = createAvatarMarkerElement({
        imageUrl: user.image,
        fallbackLabel: user.name ?? "?",
        color: user.accountType === "PROVIDER" ? "#2F7A4F" : "#432dd7",
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([user.lastLongitude, user.lastLatitude])
        .addTo(mapRef.current!);

      nearbyMarkersRef.current.push(marker);
    });

    console.log(`✅ ${nearbyMarkersRef.current.length} marqueurs ajoutés`);
    return () => {
      nearbyMarkersRef.current.forEach((m) => m.remove());
      nearbyMarkersRef.current = [];
    };
  }, [nearbyUsers, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const styleUrl = resolvedTheme === "dark" ? STYLES.dark : STYLES.light;
    console.log("🔄 Changement de style:", styleUrl);

    try {
      mapRef.current.setStyle(styleUrl);
    } catch (err) {
      console.error("❌ Erreur changement de style:", err);
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
    <div className="relative w-full h-full" style={{ minHeight: "500px" }}>
      {/* ============================================================
          Styles globaux pour rendre les contrôles MapLibre responsives
          (MapLibre applique ses styles en dur → CSS global obligatoire)
      ============================================================ */}
      <style jsx global>{`
        /* ----- NavigationControl (zoom/dézoom/boussole) ----- */

        /* Mobile : au-dessus de la bottom navbar (64px) + safe area */
        .maplibregl-ctrl-bottom-left {
          bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
          left: 8px !important;
        }

        /* Tablette et plus : position normale */
        @media (min-width: 768px) {
          .maplibregl-ctrl-bottom-left {
            bottom: 16px !important;
            left: 16px !important;
          }
        }

        /* Style des groupes de boutons (arrondi, ombre, verre dépoli) */
        .maplibregl-ctrl-bottom-left .maplibregl-ctrl-group {
          border-radius: 10px !important;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          background: rgba(0, 0, 0, 0.6) !important;
          backdrop-filter: blur(8px);
        }

        /* Boutons plus compacts en mobile, plus grands en desktop */
        .maplibregl-ctrl-bottom-left .maplibregl-ctrl-group button {
          width: 32px !important;
          height: 32px !important;
          background: transparent !important;
          color: white !important;
        }

        @media (min-width: 768px) {
          .maplibregl-ctrl-bottom-left .maplibregl-ctrl-group button {
            width: 36px !important;
            height: 36px !important;
          }
        }

        /* Icônes : forcer en blanc puisque le fond est sombre */
        .maplibregl-ctrl-bottom-left .maplibregl-ctrl-icon {
          filter: invert(1) !important;
        }

        /* Séparateurs entre les boutons */
        .maplibregl-ctrl-bottom-left .maplibregl-ctrl-group button + button {
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>

      {loadingPosition && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            <p className={`text-sm text-gray-600 ${orbitron.className}`}>
              Chargement de la carte...
            </p>
          </div>
        </div>
      )}

      {mapError && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-red-100 text-red-700 p-4 rounded-lg shadow-lg max-w-[90vw]">
          <p className="text-sm">{mapError}</p>
          <button
            onClick={() => {
              setMapError(null);
              window.location.reload();
            }}
            className={`mt-2 text-sm underline hover:no-underline cursor-pointer ${orbitron.className}`}
          >
            {t("retry")}
          </button>
        </div>
      )}

      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "#e5e7eb",
        }}
      />

      <TopToolbar
        onOpenAiSearch={() => setAiSearchOpen(true)}
        onSelectCity={handleSelectCity}
        searchMessage={searchMessage}
      />

      <AiSearchPanel open={aiSearchOpen} onClose={() => setAiSearchOpen(false)} />

      {/* Bouton 3D responsive */}
      <button
        onClick={resetView}
        title="Réinitialiser la vue"
        className={`absolute z-10 bg-black/60 hover:bg-black/75 backdrop-blur-sm text-white rounded-lg shadow-md cursor-pointer transition-colors
                    right-2 bottom-[calc(72px+env(safe-area-inset-bottom,0px))]
                    md:right-4 md:bottom-4
                    text-xs px-2.5 h-9
                    md:text-sm md:px-3 md:h-10
                    ${orbitron.className}`}
      >
        3D
      </button>
    </div>
  );
}