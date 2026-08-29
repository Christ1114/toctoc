
"use client";
import { useEffect } from "react";
import { useRouter  } from "@/i18n/navigation"; 
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl" 
import {  Loader } from 'lucide-react';
import Image from "next/image";
import Img from "@/public/assets/pictures/masquote2.webp";
import { orbitron } from "@/fonts/font";

export default function PrecheckPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
   const t = useTranslations('precheck');

  useEffect(() => {
    const performSecurityCheck = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      document.cookie = "security_check_passed=true; path=/; max-age=1800";
      document.cookie = `security_check_timestamp=${Date.now()}; path=/; max-age=1800`;

      const callbackUrl = searchParams.get("callbackUrl") || "/preloading";
      router.push(callbackUrl);
      router.refresh();
    };

    performSecurityCheck();
  }, [router, searchParams]);

  return (
    <div className={`min-h-screen flex items-center justify-center ${orbitron.className}`}>
      <div className="text-center flex  flex-col items-center justify-center">
        <Image src={Img} alt="Logo" width={100} height={100} />
        <h2 className="text-xl font-bold mb-2"> {t('title')}</h2>
        <p className="text-sm text-zinc-500"> {t('message')}</p>
        <Loader className="w-8 h-8 text-[#432dd7] mx-auto mt-4 animate-spin" />
      </div>
    </div>
  );
}