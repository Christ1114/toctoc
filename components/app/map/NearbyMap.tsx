"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { getSession } from "@/app/lib/auth-client";
import { useGeolocation } from "@/app/hooks/useGeolocation";
import { createAvatarMarkerElement } from "./AvatarMarker";
import TopToolbar from "./TopToolbar";
import AiSearchPanel from "./AiSearchPanel";
import { orbitron } from "@/fonts/font";

const STYLES = {
  light: "https://tiles.openfreemap.org/styles/liberty",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

export default function NearbyMap() {
  const t = useTranslations("NearbyMap");
  const { resolvedTheme } = useTheme();

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(null);
  const [loadingPosition, setLoadingPosition] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [aiSearchOpen, setAiSearchOpen] = useState(false);

  const { latitude, longitude, requestLocation } = useGeolocation();

  useEffect(() => {
    const loadStoredPosition = async () => {
      try {
        const { session } = await getSession();
        const storedLat = (session?.user as any)?.lastLatitude;
        const storedLng = (session?.user as any)?.lastLongitude;

        if (storedLat && storedLng) {
          setInitialCenter([storedLng, storedLat]);
          setLoadingPosition(false);
          return;
        }
      } catch (err) {
        console.error("Erreur récupération session:", err);
      }
      requestLocation();
    };

    loadStoredPosition();
  }, [requestLocation]);

  useEffect(() => {
    if (latitude && longitude) {
      setInitialCenter([longitude, latitude]);
      setLoadingPosition(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !initialCenter) return;

    const styleUrl = resolvedTheme === "dark" ? STYLES.dark : STYLES.light;

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: initialCenter,
      zoom: 15,
      pitch: 60,
      bearing: -17.6,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    mapRef.current.on("load", () => setMapLoaded(true));

    const userMarkerEl = createAvatarMarkerElement({
      fallbackLabel: t("me"),
      color: "#432dd7",
    });

    userMarkerRef.current = new maplibregl.Marker({
      element: userMarkerEl,
      anchor: "bottom",
    })
      .setLngLat(initialCenter)
      .setPopup(
        new maplibregl.Popup({ offset: 30, className: "custom-popup" }).setHTML(
          `<span>${t("youAreHere")}</span>`
        )
      )
      .addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [initialCenter, t]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !resolvedTheme) return;

    const styleUrl = resolvedTheme === "dark" ? STYLES.dark : STYLES.light;
    mapRef.current.setStyle(styleUrl);
  }, [resolvedTheme, mapLoaded]);

  useEffect(() => {
    if (latitude && longitude && mapRef.current && userMarkerRef.current) {
      userMarkerRef.current.setLngLat([longitude, latitude]);
      mapRef.current.flyTo({ center: [longitude, latitude], zoom: 13 });
    }
  }, [latitude, longitude]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {loadingPosition && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black/30 dark:border-white/30" />
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />

      <TopToolbar onOpenAiSearch={() => setAiSearchOpen(true)} />

      <AiSearchPanel open={aiSearchOpen} onClose={() => setAiSearchOpen(false)} />

      <button
        onClick={requestLocation}
        className={`absolute bottom-4 left-4 z-10 bg-black/60 hover:bg-black/75 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg shadow-md border border-white/10 cursor-pointer transition-colors ${orbitron.className}`}
      >
        📍 {t("locateMe")}
      </button>
    </div>
  );
}