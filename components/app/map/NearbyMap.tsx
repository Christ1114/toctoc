"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

// Styles avec support 3D
const STYLES = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
} as const;

// Position par défaut (Paris)
const DEFAULT_CENTER: [number, number] = [2.3522, 48.8566];
const DEFAULT_ZOOM = 15;
const DEFAULT_PITCH = 60;
const DEFAULT_BEARING = -17.6;

export default function NearbyMap() {
  const t = useTranslations("NearbyMap");
  const { resolvedTheme } = useTheme();

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const initialCenterRef = useRef<[number, number] | null>(null);

  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(null);
  const [loadingPosition, setLoadingPosition] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [aiSearchOpen, setAiSearchOpen] = useState(false);

  const { latitude, longitude, error: geoError, requestLocation } = useGeolocation();

  // Récupérer la position initiale
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadStoredPosition = async () => {
      try {
        const { session } = await getSession();
        const userData = session?.user as any;
        const storedLat = userData?.lastLatitude;
        const storedLng = userData?.lastLongitude;

        if (storedLat && storedLng && isMounted) {
          console.log("✅ Position stockée trouvée:", storedLat, storedLng);
          const position: [number, number] = [storedLng, storedLat];
          initialCenterRef.current = position;
          setInitialCenter(position);
          setLoadingPosition(false);
          return;
        }
      } catch (err) {
        console.error("❌ Erreur récupération session:", err);
      }
      
      // Demander la géolocalisation
      requestLocation();
      
      // Fallback après 5 secondes
      timeoutId = setTimeout(() => {
        if (isMounted && !initialCenterRef.current) {
          console.log("⚠️ Fallback: position par défaut");
          initialCenterRef.current = DEFAULT_CENTER;
          setInitialCenter(DEFAULT_CENTER);
          setLoadingPosition(false);
        }
      }, 5000);
    };

    loadStoredPosition();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [requestLocation]);

  // Mettre à jour la position quand la géolocalisation répond
  useEffect(() => {
    if (latitude && longitude) {
      console.log("✅ Position GPS obtenue:", latitude, longitude);
      const position: [number, number] = [longitude, latitude];
      initialCenterRef.current = position;
      setInitialCenter(position);
      setLoadingPosition(false);
    }
  }, [latitude, longitude]);

  // Gérer les erreurs de géolocalisation
  useEffect(() => {
    if (geoError && !initialCenterRef.current) {
      console.error("❌ Erreur géolocalisation:", geoError);
      initialCenterRef.current = DEFAULT_CENTER;
      setInitialCenter(DEFAULT_CENTER);
      setLoadingPosition(false);
    }
  }, [geoError]);

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !initialCenter) return;

    const styleUrl = resolvedTheme === "dark" ? STYLES.dark : STYLES.light;
    console.log("🗺️ Initialisation carte 3D avec style:", styleUrl);
    console.log("📍 Centre:", initialCenter);

    try {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: initialCenter,
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        bearing: DEFAULT_BEARING,
        attributionControl: {},
        maxPitch: 85,
        minZoom: 3,
        maxZoom: 20,
        // Supprimer antialias car il n'est pas supporté dans les options
        // ou utiliser canvasContextAttributes si nécessaire
      });

      mapRef.current = map;

      // Contrôles de navigation
      map.addControl(
        new maplibregl.NavigationControl({ 
          visualizePitch: true,
          showZoom: true,
          showCompass: true,
        }), 
        "top-right"
      );

      map.addControl(
        new maplibregl.ScaleControl(),
        "bottom-right"
      );

      // Activer les contrôles 3D
      map.dragRotate.enable();
      map.touchZoomRotate.enableRotation();

      // Gérer les erreurs
      map.on("error", (e) => {
        console.error("❌ Erreur carte:", e);
        setMapError(t("mapError"));
      });

      // Ajouter la couche 3D des bâtiments
      const add3DBuildings = () => {
        if (!map.getSource("composite")) return;

        try {
          if (!map.getLayer("3d-buildings")) {
            map.addLayer({
              id: "3d-buildings",
              source: "composite",
              "source-layer": "building",
              filter: ["==", "extrude", "true"],
              type: "fill-extrusion",
              minzoom: 15,
              paint: {
                "fill-extrusion-color": resolvedTheme === "dark" ? "#666" : "#aaa",
                "fill-extrusion-height": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15,
                  0,
                  15.05,
                  ["get", "height"]
                ],
                "fill-extrusion-base": ["get", "min_height"],
                "fill-extrusion-opacity": resolvedTheme === "dark" ? 0.4 : 0.6
              }
            });
            console.log("✅ Couche 3D bâtiments ajoutée");
          }
        } catch (err) {
          console.log("⚠️ Pas de couche 3D bâtiments disponible:", err);
        }
      };

      // Quand la carte est chargée
      map.on("load", () => {
        console.log("✅ Carte chargée avec succès");
        setMapLoaded(true);
        
        // Ajouter les bâtiments 3D
        add3DBuildings();

        // Ajouter le marqueur utilisateur
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
            .setPopup(
              new maplibregl.Popup({ 
                offset: 30, 
                className: "custom-popup" 
              }).setHTML(`<span>${t("youAreHere")}</span>`)
            )
            .addTo(map);
            
          console.log("✅ Marqueur utilisateur ajouté");
        } catch (err) {
          console.error("❌ Erreur création marqueur:", err);
        }
      });

    } catch (err) {
      console.error("❌ Erreur initialisation carte:", err);
      setMapError(t("mapInitError"));
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        console.log("🗑️ Nettoyage carte");
        mapRef.current.remove();
        mapRef.current = null;
        userMarkerRef.current = null;
        setMapLoaded(false);
      }
    };
  }, [initialCenter, t]); // Dépendances stables

  // Gérer le changement de thème
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !resolvedTheme) return;

    const styleUrl = resolvedTheme === "dark" ? STYLES.dark : STYLES.light;
    console.log("🔄 Changement de style:", styleUrl);
    
    // Sauvegarder l'état actuel
    const currentState = {
      center: map.getCenter(),
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
    };

    const handleStyleLoad = () => {
      if (!mapRef.current) return;
      
      // Restaurer l'état
      mapRef.current.jumpTo(currentState);
      
      // Réajouter les bâtiments 3D avec la bonne couleur
      try {
        if (mapRef.current.getLayer("3d-buildings")) {
          mapRef.current.setPaintProperty(
            "3d-buildings",
            "fill-extrusion-color",
            resolvedTheme === "dark" ? "#666" : "#aaa"
          );
          mapRef.current.setPaintProperty(
            "3d-buildings",
            "fill-extrusion-opacity",
            resolvedTheme === "dark" ? 0.4 : 0.6
          );
        }
      } catch (err) {
        console.log("⚠️ Impossible de mettre à jour les bâtiments 3D:", err);
      }
    };

    map.once("style.load", handleStyleLoad);
    map.setStyle(styleUrl);

    return () => {
      map.off("style.load", handleStyleLoad);
    };
  }, [resolvedTheme, mapLoaded]);

  // Mettre à jour la position en temps réel
  const updateUserPosition = useCallback(() => {
    if (latitude && longitude && mapRef.current && userMarkerRef.current) {
      console.log("🔄 Mise à jour position:", latitude, longitude);
      const newPosition: [number, number] = [longitude, latitude];
      
      userMarkerRef.current.setLngLat(newPosition);
      mapRef.current.flyTo({ 
        center: newPosition, 
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        bearing: DEFAULT_BEARING,
        essential: true,
        duration: 2000,
      });
    }
  }, [latitude, longitude]);

  useEffect(() => {
    updateUserPosition();
  }, [updateUserPosition]);

  // Réinitialiser la vue 3D
  const resetView = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({ 
        center: initialCenter || DEFAULT_CENTER, 
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        bearing: DEFAULT_BEARING,
        essential: true,
        duration: 1000,
      });
    }
  }, [initialCenter]);

  // Relocaliser l'utilisateur
  const handleLocate = useCallback(() => {
    requestLocation();
    if (initialCenter) {
      resetView();
    }
  }, [requestLocation, initialCenter, resetView]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100 dark:bg-gray-800">
      {/* Loading */}
      {loadingPosition && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black/30 dark:border-white/30" />
            <p className="text-sm text-gray-500">{t("loadingPosition")}</p>
          </div>
        </div>
      )}
      
      {/* Message d'erreur */}
      {mapError && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-red-100 text-red-700 p-4 rounded-lg shadow-lg">
          <p>{mapError}</p>
          <button 
            onClick={() => {
              setMapError(null);
              window.location.reload();
            }}
            className="mt-2 text-sm underline hover:no-underline"
          >
            {t("retry")}
          </button>
        </div>
      )}
      
      {/* Container carte */}
      <div 
        ref={mapContainer} 
        className="w-full h-full" 
        style={{ 
          height: "100%", 
          minHeight: "400px",
          cursor: "grab",
        }}
      />

      <TopToolbar onOpenAiSearch={() => setAiSearchOpen(true)} />
      <AiSearchPanel open={aiSearchOpen} onClose={() => setAiSearchOpen(false)} />

      {/* Bouton réinitialiser la vue 3D */}
      <button
        onClick={resetView}
        className="absolute bottom-4 right-4 z-10 bg-black/60 hover:bg-black/75 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg shadow-md border border-white/10 cursor-pointer transition-colors"
        title={t("reset3DView")}
        aria-label={t("reset3DView")}
      >
        🏔️ 3D
      </button>

      {/* Bouton localiser */}
      <button
        onClick={handleLocate}
        className={`absolute bottom-4 left-4 z-10 bg-black/60 hover:bg-black/75 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg shadow-md border border-white/10 cursor-pointer transition-colors ${orbitron.className}`}
      >
        📍 {t("locateMe")}
      </button>
    </div>
  );
}