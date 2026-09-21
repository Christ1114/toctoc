"use client";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader, CheckCircle, XCircle } from "lucide-react";
import { orbitron } from "@/fonts/font";
import Img from "@/public/assets/pictures/masquote2.webp";
import Image from "next/image";
import { performPrecheck } from "@/app/actions/precheck";

export default function PrecheckPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("precheck");
  const [locationStatus, setLocationStatus] = useState<"checking" | "valid" | "invalid">("checking");

  useEffect(() => {
    const run = async () => {
      // ✅ callbackUrl validé : jamais d'open redirect
      const raw = searchParams.get("callbackUrl");
      const callbackUrl = raw && raw.startsWith("/") ? raw : "/preloading";

      if (!navigator.geolocation) {
        setLocationStatus("invalid");
        return;
      }

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });

        const result = await performPrecheck(
          position.coords.latitude,
          position.coords.longitude
        );

        if (!result.ok) {
          setLocationStatus("invalid");
          return;
        }

        setLocationStatus("valid");
        setTimeout(() => router.push(callbackUrl), 1000);
      } catch (error) {
        console.error("Erreur vérification:", error);
        setLocationStatus("invalid");
      }
    };

    run();
  }, [router, searchParams]);

  return (
    <div className={`min-h-screen flex items-center justify-center ${orbitron.className}`}>
      <div className="text-center px-4 flex flex-col items-center justify-center">
        <Image src={Img} alt="Logo" width={100} height={100} className="mb-4" />
        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          {locationStatus === "checking" ? (
            <Loader className="w-10 h-10 text-[#432dd7] animate-spin" />
          ) : locationStatus === "valid" ? (
            <CheckCircle className="w-10 h-10 text-green-600" />
          ) : (
            <XCircle className="w-10 h-10 text-red-600" />
          )}
        </div>

        <h2 className="text-xl font-bold mb-3">
          {locationStatus === "checking"
            ? t("title")
            : locationStatus === "valid"
            ? t("success")
            : t("error")}
        </h2>

        <p className="text-sm text-zinc-500 mb-6">
          {locationStatus === "checking" && t("message")}
          {locationStatus === "valid" && t("redirecting")}
          {locationStatus === "invalid" && t("locationRequired")}
        </p>
      </div>
    </div>
  );
}