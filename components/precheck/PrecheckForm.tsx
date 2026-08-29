"use client";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Shield, Loader, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { orbitron } from "@/fonts/font";
import Img from "@/public/assets/pictures/masquote2.webp";
import Image from "next/image";

export default function PrecheckPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('precheck');
  const [locationStatus, setLocationStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');

  useEffect(() => {
    const performSecurityCheck = async () => {
      try {
       
        const locationValid = await checkLocation();
        
        if (!locationValid) {
          setLocationStatus('invalid');
          return;
        }

        
        const vpnValid = await checkVpn();
        
        if (!vpnValid) {
          setLocationStatus('invalid');
          return;
        }

      
        setLocationStatus('valid');
        
       
        document.cookie = "security_check_passed=true; path=/; max-age=1800";
        document.cookie = `security_check_timestamp=${Date.now()}; path=/; max-age=1800`;

       
        const callbackUrl = searchParams.get("callbackUrl") || "/preloading";
        setTimeout(() => {
          router.push(callbackUrl);
          router.refresh();
        }, 1000);
      } catch (error) {
        console.error("Erreur vérification:", error);
        setLocationStatus('invalid');
      }
    };

    performSecurityCheck();
  }, [router, searchParams]);

  const checkLocation = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const { validateLocation } = await import("@/app/lib/security/locationCheck");
          const result = validateLocation(latitude, longitude, {
            usePolygon: true,
            checkRegion: true,
          });

          resolve(result.isValid);
        },
        (error) => {
          console.error("Erreur géolocalisation:", error);
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const checkVpn = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/security/vpn-check');
      const data = await response.json();
      return !data.isVpn;
    } catch (error) {
      return false;
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${orbitron.className} `}> 
      <div className="text-center px-4 flex flex-col items-center justify-center">
        <Image src={Img} alt="Logo" width={100} height={100} className="mb-4" />
        <div className="w-20 h-20 mx-auto mb-6  flex items-center justify-center">
          {locationStatus === 'checking' ? (
            <Loader className="w-10 h-10 text-[#432dd7] animate-spin" />
          ) : locationStatus === 'valid' ? (
            <CheckCircle className="w-10 h-10 text-green-600" />
          ) : (
            <XCircle className="w-10 h-10 text-red-600" />
          )}
        </div>
        
        <h2 className="text-xl font-bold mb-3">
          {locationStatus === 'checking' 
            ? t('title') 
            : locationStatus === 'valid' 
            ? t('success') 
            : t('error')}
        </h2>
        
        <p className="text-sm text-zinc-500 mb-6">
          {locationStatus === 'checking' && t('message')}
          {locationStatus === 'valid' && t('redirecting')}
          {locationStatus === 'invalid' && t('locationRequired')}
        </p>
      </div>
    </div>
  );
}