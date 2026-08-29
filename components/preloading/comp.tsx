"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { orbitron } from "@/fonts/font";
import {
  MapPin,
  ShieldAlert,
  CheckCircle,
  ChevronRight,
  Loader2,
  Lock,
  RotateCw,
} from "lucide-react";
import Image from "next/image";
import Img1 from "@/public/assets/pictures/msP1.webp";
import Img2 from "@/public/assets/pictures/msPr2.webp";

type LocationState = "idle" | "requesting" | "granted" | "denied";
type VpnState = "idle" | "checking" | "clean" | "detected";

const PreloadingPage = () => {
  const t = useTranslations("precheck");
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [vpnState, setVpnState] = useState<VpnState>("idle");
  const [showVpnPopup, setShowVpnPopup] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const handleActivateLocation = useCallback(() => {
    setLocationState("requesting");

    if (!navigator.geolocation) {
      setLocationState("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
       
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationState("granted");
      },
      () => setLocationState("denied"),
      { 
        timeout: 8000,
        enableHighAccuracy: true,
        maximumAge: 0,
      }
    );
  }, []);

  const handleNextFromLocation = () => {
    if (locationState !== "granted") return;
    setStep(2);
    checkVpn();
  };

  const checkVpn = useCallback(async () => {
    setVpnState("checking");
    setShowVpnPopup(false);
    
    try {
      
      const res = await fetch("/api/security/vpn-check", {
        headers: {
          "x-internal-request": process.env.NEXT_PUBLIC_INTERNAL_REQUEST_SECRET || "",
        },
        credentials: "include",
      });

      if (res.status === 401) {
        
        console.error("Non authentifié");
        router.replace("/login");
        return;
      }

      if (res.status === 403) {
        console.error("Accès non autorisé");
        setVpnState("clean"); 
        return;
      }

      if (res.status === 429) {
        console.error("Trop de requêtes");
        setVpnState("clean"); 
        return;
      }

      const data = await res.json();

      if (data.isVpn) {
        setVpnState("detected");
        setShowVpnPopup(true);
      } else {
        setVpnState("clean");
      }
    } catch (error) {
      console.error("Erreur vérification VPN:", error);
      setVpnState("clean");
    }
  }, [router]);
  const saveUserLocation = useCallback(async (lat: number, lng: number, region?: string) => {
  try {
    const res = await fetch("/api/security/update-user-location", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-request": process.env.NEXT_PUBLIC_INTERNAL_REQUEST_SECRET || "",
      },
      credentials: "include",
      body: JSON.stringify({ lat, lng, region }),
    });

    if (!res.ok) {
      console.error("Erreur sauvegarde localisation:", res.status);
    }
  } catch (error) {
    console.error("Erreur réseau sauvegarde localisation:", error);
  }
}, []);

  const validateLocation = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch("/api/security/location-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-request": process.env.NEXT_PUBLIC_INTERNAL_REQUEST_SECRET || "",
        },
        credentials: "include",
        body: JSON.stringify({ lat, lng }),
      });

      if (res.status === 401) {
        console.error("Non authentifié");
        router.replace("/login");
        return { isValid: false, reason: "non-authentifie" };
      }

      if (res.status === 403) {
        console.error("Accès non autorisé");
        return { isValid: false, reason: "non-autorise" };
      }

      if (res.status === 429) {
        console.error("Trop de requêtes");
        return { isValid: false, reason: "trop-de-requetes" };
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Erreur validation localisation:", error);
      return { isValid: false, reason: "erreur-validation" };
    }
  }, [router]);

 const handleContinueToDashboard = async () => {
  if (!coordinates) {
    console.error("Coordonnées manquantes");
    return;
  }

  const locationResult = await validateLocation(coordinates.lat, coordinates.lng);

  if (locationResult.isValid) {
    
    await saveUserLocation(coordinates.lat, coordinates.lng, locationResult.region);
    router.replace("/dashboard");
  } else {
    console.error("Localisation invalide:", locationResult.reason);
    alert(t("location.invalidLocation"));
  }
};

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-8 ${orbitron.className}`}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-6">
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? "bg-[#432dd7]" : "bg-zinc-300 dark:bg-zinc-700"}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? "bg-[#432dd7]" : "bg-zinc-300 dark:bg-zinc-700"}`} />
        </div>
        
        {step === 1 && (
          <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 sm:p-5 text-center">
              <div className="w-30 h-30 mx-auto mb-3 flex items-center justify-center">
                <Image src={Img1} width={150} height={150} alt="Map pin" className="text-[#432dd7]" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-black dark:text-zinc-100">
                {t("location.title")}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {t("location.subtitle")}
              </p>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  locationState === "granted"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/10"
                    : locationState === "denied"
                    ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                    : "border-zinc-300 dark:border-zinc-600"
                }`}
              >
                {locationState === "granted" && <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />}
                {locationState === "denied" && <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />}
                {(locationState === "idle" || locationState === "requesting") && (
                  <MapPin className="w-5 h-5 text-zinc-400 shrink-0" />
                )}
                <span className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                  {locationState === "granted"
                    ? t("location.granted")
                    : locationState === "denied"
                    ? t("location.denied")
                    : locationState === "requesting"
                    ? t("location.requesting")
                    : t("location.notActivated")}
                </span>
              </div>

              {locationState === "denied" && (
                <p className="text-[10px] sm:text-xs text-red-500 flex items-start gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {t("location.deniedHelp")}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleActivateLocation}
                  disabled={locationState === "requesting" || locationState === "granted"}
                  className="flex-1 cursor-pointer border border-[#432dd7] text-[#432dd7] hover:bg-[#432dd7]/5 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {locationState === "requesting" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  {locationState === "granted" ? t("location.activated") : t("location.activate")}
                </button>

                <button
                  type="button"
                  onClick={handleNextFromLocation}
                  disabled={locationState !== "granted"}
                  className="flex-1 cursor-pointer bg-[#432dd7] hover:bg-[#554c8f] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t("navigation.next")}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 sm:p-5 text-center">
              <div className="w-30 h-30 mx-auto mb-3 flex items-center justify-center">
                <Image src={Img2} width={150} height={150} alt="Map pin" className="text-[#432dd7]" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-black dark:text-zinc-100">
                {t("vpn.title")}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {t("vpn.subtitle")}
              </p>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  vpnState === "clean"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/10"
                    : vpnState === "detected"
                    ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                    : "border-zinc-300 dark:border-zinc-600"
                }`}
              >
                {vpnState === "checking" && <Loader2 className="w-5 h-5 animate-spin text-[#432dd7] shrink-0" />}
                {vpnState === "clean" && <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />}
                {vpnState === "detected" && <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />}
                <span className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                  {vpnState === "checking"
                    ? t("vpn.checking")
                    : vpnState === "clean"
                    ? t("vpn.clean")
                    : vpnState === "detected"
                    ? t("vpn.detected")
                    : t("vpn.idle")}
                </span>
              </div>

              {vpnState === "detected" && (
                <button
                  type="button"
                  onClick={checkVpn}
                  className="w-full border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCw className="w-4 h-4" />
                  {t("vpn.retry")}
                </button>
              )}

              {vpnState === "clean" && (
                <button
                  type="button"
                  onClick={handleContinueToDashboard}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t("navigation.continue")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showVpnPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm bg-white dark:bg-zinc-900 border border-red-500/40 rounded-lg overflow-hidden shadow-2xl ${orbitron.className}`}>
            <div className="bg-red-600 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{t("vpn.popupTitle")}</h3>
                <p className="text-[10px] text-red-100">{t("vpn.popupSubtitle")}</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 dark:text-red-300">{t("vpn.popupMessage")}</p>
              </div>

              <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                {t("vpn.popupInstruction")}
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowVpnPopup(false);
                  checkVpn();
                }}
                className="w-full bg-[#432dd7] hover:bg-[#554c8f] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                {t("vpn.popupRetry")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreloadingPage;