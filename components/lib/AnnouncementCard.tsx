'use client';

import { orbitron } from '@/fonts/font';
import { Baby, Sparkles, ChefHat, Car, Shield, Flower2, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Announcement = {
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

const JOB_ICONS: Record<string, React.ElementType> = {
  nounou: Baby,
  menagere: Sparkles,
  cuisinier: ChefHat,
  chauffeur: Car,
  gardien: Shield,
  jardinier: Flower2,
};

export default function AnnouncementCard({ announcement: a }: { announcement: Announcement | null | undefined }) {
  const t = useTranslations("announcementCard");

  if (!a) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('AnnouncementCard reçu sans `announcement`');
    }
    return null;
  }

  const Icon = JOB_ICONS[a.jobType?.slug ?? ''] ?? Sparkles;
  const isRtl = a.language === 'ar';
  const workDays = a.workDays ?? [];

  function formatSalary(a: Announcement): string {
    if (a.salaryRaw) return a.salaryRaw;
    if (a.salaryMin && a.salaryMax && a.salaryMin !== a.salaryMax) {
      return `${a.salaryMin.toLocaleString('fr-FR')} - ${a.salaryMax.toLocaleString('fr-FR')} FCFA/${a.salaryPeriod ?? t("salaryPeriod")}`;
    }
    if (a.salaryMin) return `${a.salaryMin.toLocaleString('fr-FR')} FCFA/${a.salaryPeriod ?? t("salaryPeriod")}`;
    return t("salaryNegotiable");
  }

  function formatTransport(a: Announcement): string {
    if (a.transportAllowance === null || a.transportAllowance === undefined) return '';
    if (a.transportAllowance === 0) return t("noTransport");
    return `+${a.transportAllowance.toLocaleString('fr-FR')} FCFA transport`;
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`flex flex-col sm:flex-row w-full max-w-6xl gap-2 sm:gap-4 
                  border-b border-gray-200 dark:border-stone-700 
                  bg-white dark:bg-stone-900 
                  px-3 sm:px-4 py-3 sm:py-4 
                  last:border-b-0 
                  hover:bg-gray-50 dark:hover:bg-stone-800
                  transition-colors duration-200 ${orbitron.className}
                  ${a.isFeatured ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''}`}
    >
      
      <div className="hidden sm:flex w-16 lg:w-20 shrink-0 flex-col items-center gap-1.5">
        <div className="flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-stone-800">
          <Icon size={20} strokeWidth={1.75} className="text-gray-500 dark:text-stone-400" />
        </div>
        <Star size={14} className="text-gray-300 dark:text-stone-600" />
      </div>

     
      <div className="flex sm:w-32 lg:w-36 shrink-0 flex-row sm:flex-col items-center sm:items-start gap-2 sm:gap-0.5 text-sm">
        
        <div className="flex sm:hidden h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-stone-800 shrink-0">
          <Icon size={16} strokeWidth={1.75} className="text-gray-500 dark:text-stone-400" />
        </div>
        
        <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">
          {formatSalary(a)}
        </span>
        <span className="text-[10px] sm:text-xs text-gray-400 dark:text-stone-500">
          {formatTransport(a) || t("transportNotSpecified")}
        </span>
        {a.isVerified && (
          <span className="mt-0 sm:mt-1 inline-flex w-fit items-center rounded bg-yellow-300 dark:bg-yellow-500/80 
                           px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold 
                           text-gray-800 dark:text-gray-900">
            {t("verifiedIdentity")}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
       
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="text-sm sm:text-[15px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
            {a.title}
          </h3>
          {a.isUrgent && (
            <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {t("urgent")}
            </span>
          )}
          {a.isFeatured && (
            <span className="sm:hidden rounded border border-orange-400 px-1.5 py-0.5 text-[10px] font-bold text-orange-500">
              {t("top")}
            </span>
          )}
        </div>
        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-500 dark:text-stone-400">
           {a.location ?? a.city ?? '—'} · {a.jobType?.name ?? '—'}
          {a.workArrangement && ` · ${t(`workArrangement.${a.workArrangement}`)}`}
        </p>
        {(workDays.length > 0 || a.workStartTime) && (
          <p className="mt-0.5 text-xs sm:text-sm text-gray-500 dark:text-stone-400">
             {workDays.map((d) => t(`days.${d}`) ?? d).join(', ')}
            {a.workStartTime && `  ${a.workStartTime} ~ ${a.workEndTime ?? '?'}`}
          </p>
        )}
        <p className="mt-0.5 text-xs sm:text-sm text-gray-500 dark:text-stone-400">
          {a.contractDuration ? t(`contract.${a.contractDuration}`) : ''}
          {a.experienceYearsRequired != null
            ? ` · ${t("experience.required", { years: a.experienceYearsRequired })}`
            : ` · ${t("experience.notRequired")}`}
        </p>
      </div>
      <div className="hidden sm:flex w-20 lg:w-24 shrink-0 flex-col items-end gap-1 text-right">
        {a.isFeatured && (
          <span className="rounded border border-orange-400 dark:border-orange-500 px-2 py-0.5 text-[11px] font-bold text-orange-500 dark:text-orange-400">
            {t("top")}
          </span>
        )}
        <span className="text-xs sm:text-sm text-gray-500 dark:text-stone-400">
           {a.viewCount ?? 0}
        </span>
        <span className="text-[10px] sm:text-[11px] text-gray-400 dark:text-stone-500">
          {a.type ? t(`type.${a.type}`) : ''}
        </span>
      </div>
      <div className="flex sm:hidden items-center justify-between mt-1 pt-1 border-t border-gray-100 dark:border-stone-800">
        <span className="text-[10px] text-gray-400 dark:text-stone-500">
           {a.viewCount ?? 0} · {a.type ? t(`type.${a.type}`) : ''}
        </span>
      </div>
    </div>
  );
}