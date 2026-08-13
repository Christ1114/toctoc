'use client';

import { Baby, Sparkles, ChefHat, Car, Shield, Flower2, Star } from 'lucide-react';
import { orbitron } from '@/fonts/font';
import { useTranslations } from 'next-intl';

type Profile = {
  id: string;
  title: string;
  description: string | null;
  type: 'OFFER' | 'PROFILE';
  language: string;
  city: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: string | null;
  salaryRaw: string | null;
  transportAllowance: number | null;
  isUrgent: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  viewCount: number;
  workArrangement: 'NAVETTE' | 'LOGE_SUR_PLACE' | null;
  shift: 'JOUR' | 'NUIT' | null;
  contractDuration: 'TEMPORAIRE' | 'PERMANENT' | null;
  workDays: string[];
  workStartTime: string | null;
  workEndTime: string | null;
  experienceYearsRequired: number | null;
  jobType: { name: string; slug: string };
  region: { name: string };
  source: { name: string };
};

function formatSalary(p: Profile, t: any): string {
  if (p.salaryRaw) return p.salaryRaw;
  if (p.salaryMin && p.salaryMax && p.salaryMin !== p.salaryMax) {
    return `${p.salaryMin.toLocaleString('fr-FR')} - ${p.salaryMax.toLocaleString('fr-FR')} FCFA`;
  }
  if (p.salaryMin) return `${p.salaryMin.toLocaleString('fr-FR')} FCFA`;
  return t("salaryNegotiable");
}

function getInitials(title: string): string {
  const words = title.split(' ');
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return title.slice(0, 2).toUpperCase();
}

export default function ProfileCard({ profile: p }: { profile: Profile | null | undefined }) {
  const t = useTranslations("profileCard");

  if (!p) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('ProfileCard reçu sans `profile` — vérifie le .map() de la page appelante.');
    }
    return null;
  }

  const isRtl = p.language === 'ar';
  const workDays = p.workDays ?? [];
  const initials = getInitials(p.title);
  const fullName = p.title?.split(' - ')[0] ?? p.title ?? 'Candidat';
  const jobTitle = p.title?.split(' - ')[1] ?? p.jobType?.name ?? '';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`flex flex-col sm:flex-row w-full max-w-6xl gap-2 sm:gap-4 
                  border-b border-gray-200 dark:border-stone-700 
                  bg-white dark:bg-stone-900 
                  px-3 sm:px-4 py-3 sm:py-4 
                  last:border-b-0 
                  hover:bg-gray-50 dark:hover:bg-stone-800 ${orbitron.className}
                  transition-colors duration-200
                  ${p.isFeatured ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''}`}
    >
      
      <div className="hidden sm:flex w-16 lg:w-20 shrink-0 flex-col items-center gap-1.5">
        <div className="flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-stone-800">
          <span className="text-sm font-bold text-gray-500 dark:text-stone-400">{initials}</span>
        </div>
        <Star size={14} className="text-gray-300 dark:text-stone-600" />
      </div>

     
      <div className="flex sm:w-32 lg:w-36 shrink-0 flex-row sm:flex-col items-center sm:items-start gap-2 sm:gap-0.5 text-sm">
        
        <div className="flex sm:hidden h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-stone-800 shrink-0">
          <span className="text-xs font-bold text-gray-500 dark:text-stone-400">{initials}</span>
        </div>
        
        <span className={`text-xs sm:text-sm font-bold ${p.isFeatured ? 'text-amber-600 dark:text-amber-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {formatSalary(p, t)}
        </span>
        <span className="text-[10px] sm:text-xs text-gray-400 dark:text-stone-500">
          {p.jobType?.name ?? '—'}
        </span>
       
      </div>

     
      <div className="min-w-0 flex-1">
       
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className={`text-sm sm:text-[15px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer ${orbitron.className}`}>
            {fullName}
          </h3>
          {p.isUrgent && (
            <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {t("urgent")}
            </span>
          )}
         
        </div>

        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-500 dark:text-stone-400">
          <span className="bg-gray-50 dark:bg-stone-800 px-1.5 py-0.5 rounded-md">
            {p.location ?? p.city ?? '—'}
          </span>
          <span className="mx-1">·</span>
          <span>{jobTitle}</span>
          {p.workArrangement && (
            <>
              <span className="mx-1">·</span>
              <span className="bg-gray-50 dark:bg-stone-800 px-1.5 py-0.5 rounded-full text-[10px]">
                {t(`workArrangement.${p.workArrangement}`)}
              </span>
            </>
          )}
        </p>

        <div className="flex items-center gap-1 mt-0.5 text-[10px] sm:text-xs text-gray-500 dark:text-stone-400">
          {workDays.length > 0 && (
            <span className="bg-gray-50 dark:bg-stone-800 px-1.5 py-0.5 rounded">
              {workDays.map((d) => t(`days.${d}`) ?? d).join(', ')}
            </span>
          )}
          {p.workStartTime && (
            <span className="bg-gray-50 dark:bg-stone-800 px-1.5 py-0.5 rounded font-mono text-[9px]">
              {p.workStartTime}~{p.workEndTime ?? '?'}
            </span>
          )}
          {p.contractDuration && (
            <span className={`text-[9px] font-semibold ${p.contractDuration === 'TEMPORAIRE' ? 'text-amber-600 bg-amber-50/80' : 'text-emerald-600 bg-emerald-50/80'} px-1.5 py-0.5 rounded-full border`}>
              {t(`contract.${p.contractDuration}`)}
            </span>
          )}
          {p.experienceYearsRequired != null && (
            <span>· {p.experienceYearsRequired}a</span>
          )}
        </div>
      </div>

     
      <div className="hidden sm:flex w-20 lg:w-24 shrink-0 flex-col items-end gap-1 text-right">
        
        <span className="text-xs sm:text-sm text-gray-500 dark:text-stone-400">
           {p.viewCount ?? 0}
        </span>
        
      </div>
    </div>
  );
}