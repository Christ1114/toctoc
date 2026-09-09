"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { getSession } from "@/app/lib/auth-client";
import { useGeolocation } from "@/app/hooks/useGeolocation";
import { createAvatarMarkerElement } from "./AvatarMarker";
import TopToolbar from "./TopToolbar";
import AiSearchPanel from "./AiSearchPanel";
import { orbitron } from "@/fonts/font";

// Fix MapLibre v6 : requis avec tout bundler (webpack/Turbopack via Next.js).
// Sans ceci, le Web Worker de MapLibre ne se résout pas correctement et
// aucune tuile ne s'affiche (la requête part vers la page HTML au lieu du
// fichier .mjs du worker).
setWorkerUrl(
  new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString()
);

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
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

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
      
      // Fallback immédiat avec position par défaut
      if (isMounted && !initialCenterRef.current) {
        console.log("📍 Utilisation de la position par défaut (Paris)");
        initialCenterRef.current = DEFAULT_CENTER;
        setInitialCenter(DEFAULT_CENTER);
        setLoadingPosition(false);
      }
      
      // Demander la géolocalisation en arrière-plan
      requestLocation();
      
      // Timeout de secours pour la géolocalisation
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

    console.log("🗺️ Tentative d'initialisation de la carte");
    console.log("📍 Centre:", initialCenter);
    console.log("📦 Container:", mapContainer.current);

    try {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: STYLES.light, // Commencer avec le style light par défaut
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

      // Contrôles de navigation
      map.addControl(
        new maplibregl.NavigationControl({ 
          visualizePitch: true,
          showZoom: true,
          showCompass: true,
        }), 
        "top-right"
      );

      // Activer les contrôles 3D
      map.dragRotate.enable();
      map.touchZoomRotate.enableRotation();

      // Gérer les erreurs
      map.on("error", (e) => {
        console.error("❌ Erreur carte:", e);
        setMapError("Erreur de chargement de la carte");
      });

      // Quand le style est chargé
      map.on("style.load", () => {
        console.log("✅ Style chargé");
      });

      // Quand la carte est chargée
      map.on("load", () => {
        console.log("✅ Carte chargée avec succès");
        setMapLoaded(true);
        
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
  }, [initialCenter, t]);

  // Gérer le changement de thème
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

  // Réinitialiser la vue
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

  // Relocaliser l'utilisateur
  const handleLocate = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: "500px" }}>
      {/* Loading */}
      {loadingPosition && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            <p className="text-sm text-gray-600">Chargement de la carte...</p>
          </div>
        </div>
      )}
      
      {/* Message d'erreur */}
      {mapError && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-red-100 text-red-700 p-4 rounded-lg shadow-lg">
          <p>{mapError}</p>
          <button 
            onClick={() => {
              setMapError(null);
              window.location.reload();
            }}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      )}
      
      {/* Container carte - TOUJOURS visible */}
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
          backgroundColor: "#e5e7eb", // Gris clair de secours
        }}
      />

      <TopToolbar onOpenAiSearch={() => setAiSearchOpen(true)} />
      <AiSearchPanel open={aiSearchOpen} onClose={() => setAiSearchOpen(false)} />

      {/* Bouton réinitialiser la vue */}
      <button
        onClick={resetView}
        className="absolute bottom-4 right-4 z-10 bg-black/60 hover:bg-black/75 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg shadow-md cursor-pointer"
        title="Réinitialiser la vue"
      >
        🏔️ 3D
      </button>

      {/* Bouton localiser */}
      <button
        onClick={handleLocate}
        className={`absolute bottom-4 left-4 z-10 bg-black/60 hover:bg-black/75 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg shadow-md cursor-pointer ${orbitron.className}`}
      >
        📍 {t("locateMe")}
      </button>
    </div>
  );
}