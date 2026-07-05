'use client';

import { Baby, Sparkles, ChefHat, Car, Shield, Flower2, Star } from 'lucide-react';
import { orbitron } from '@/fonts/font';
import Link from 'next/link';
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

const JOB_ICONS: Record<string, React.ElementType> = {
  nounou: Baby,
  menagere: Sparkles,
  cuisinier: ChefHat,
  chauffeur: Car,
  gardien: Shield,
  jardinier: Flower2,
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
    <div dir={isRtl ? 'rtl' : 'ltr'} className="relative w-full max-w-6xl group gap-y-5">
      <div
        className="absolute inset-0 -z-10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: `
            linear-gradient(to right, #F5C542 1px, transparent 1px),
            linear-gradient(to bottom, #2F7A4F 1px, transparent 1px),
            linear-gradient(to right, #C1502E 1px, transparent 1px),
            linear-gradient(to bottom, #3E7CB1 1px, transparent 1px),
            linear-gradient(to right, #6B8E23 1px, transparent 1px),
            linear-gradient(to bottom, #8B5FBF 1px, transparent 1px),
            linear-gradient(to right, #D1637A 1px, transparent 1px),
            linear-gradient(to bottom, #C9A227 1px, transparent 1px)
          `,
          backgroundSize: `3rem 3rem, 3rem 3rem, 3rem 3rem, 3rem 3rem, 3rem 3rem, 3rem 3rem, 3rem 3rem, 3rem 3rem`,
          backgroundPosition: `0 0, 0 0, 0.75rem 0, 0 0.75rem, 1.5rem 0, 0 1.5rem, 2.25rem 0, 0 2.25rem`,
          maskImage: 'radial-gradient(ellipse 100% 80% at 50% 50%, #000 60%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 80% at 50% 50%, #000 60%, transparent 100%)',
          opacity: 0.12,
        }}
      />

      <div className="absolute left-5 top-1/2 -translate-y-1/2 w-px h-3/4 bg-linear-to-b from-transparent via-zinc-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className={`
        flex w-full flex-col gap-3 bg-white/80 backdrop-blur-sm
        px-3.5 py-3 transition-all duration-300
        shadow-lg shadow-zinc-500/10
        group-hover:shadow-xl group-hover:shadow-zinc-500/20 group-hover:scale-[1.01]
        ${p.isFeatured ? 'border-amber-300/60 bg-amber-50/40 shadow-amber-500/20' : ''}
        ${p.isVerified ? 'border-emerald-300/40' : ''}
      `}>
        <div className="flex w-full gap-3">
          <div className="flex w-12 shrink-0 flex-col items-center gap-0.5">
            <div className="relative">
              <div className={`
                flex h-9 w-9 items-center justify-center rounded-xl
                bg-white/80 backdrop-blur-sm border border-zinc-200/80
                shadow-lg shadow-zinc-500/10
                group-hover:shadow-zinc-500/20 group-hover:scale-110
                transition-all duration-500
                ${p.isVerified ? 'border-emerald-300/50' : ''}
              `}>
                <span className={`text-xs font-bold ${p.isVerified ? 'text-emerald-600' : 'text-zinc-600'}`}>
                  {initials}
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-28 shrink-0 flex-col gap-0.5">
            <span className={`text-xs font-bold ${p.isFeatured ? 'text-amber-600' : 'text-zinc-700'}`}>
              {formatSalary(p, t)}
            </span>
            <span className="text-[9px] text-zinc-400">{p.jobType?.name ?? '—'}</span> 
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className={`truncate text-xs font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors duration-300 ${orbitron.className}`}>
                {fullName}
              </h3>
              {p.isUrgent && (
                <span className="flex items-center gap-0.5 rounded-full bg-rose-50/90 backdrop-blur-sm px-1.5 py-0.5 text-[8px] font-bold text-rose-600 border border-rose-200/50">
                  <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                  {t("urgent")}
                </span>
              )}
            </div>

            <p className="text-[10px] text-zinc-500 truncate group-hover:text-zinc-600 transition-colors duration-300">
              <span className="bg-zinc-50/80 px-1.5 py-0.5 rounded-md border border-zinc-100">
                {p.location ?? p.city ?? '—'}
              </span>
              <span className="mx-1 text-zinc-300">·</span>
              <span className="text-zinc-600">{jobTitle}</span>
              {p.workArrangement && (
                <>
                  <span className="mx-1 text-zinc-300">·</span>
                  <span className="text-zinc-400 text-[9px] bg-zinc-50/80 px-1.5 py-0.5 rounded-full border border-zinc-100">
                    {t(`workArrangement.${p.workArrangement}`)}
                  </span>
                </>
              )}
            </p>

            <div className="flex items-center gap-1 text-[9px] text-zinc-400 truncate group-hover:text-zinc-500 transition-colors duration-300">
              {workDays.length > 0 && (
                <span className="bg-zinc-50/80 px-1.5 py-0.5 rounded border border-zinc-100">
                  {workDays.map((d) => t(`days.${d}`) ?? d).join(', ')}
                </span>
              )}
              {p.workStartTime && (
                <span className="bg-zinc-50/80 px-1.5 py-0.5 rounded border border-zinc-100 font-mono text-[8px]">
                  {p.workStartTime}~{p.workEndTime ?? '?'}
                </span>
              )}
              {p.contractDuration && (
                <span className={`text-[8px] font-semibold ${p.contractDuration === 'TEMPORAIRE' ? 'text-amber-600 bg-amber-50/80' : 'text-emerald-600 bg-emerald-50/80'} px-1.5 py-0.5 rounded-full border`}>
                  {t(`contract.${p.contractDuration}`)}
                </span>
              )}
              {p.experienceYearsRequired != null && (
                <span className="text-zinc-400">· {p.experienceYearsRequired}a</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end border-t border-zinc-100 pt-2">
          <Link
            href={`/profils/${p.id}`}
            className="text-[11px] font-bold px-3.5 py-1.5 border-2 border-zinc-300 text-zinc-600 whitespace-nowrap backdrop-blur-sm bg-white/60 hover:bg-zinc-100 hover:border-zinc-400 hover:text-zinc-800 transition-all duration-300 flex items-center gap-1.5 group/btn"
            aria-label={t("aria.contact", { name: fullName })}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {t("tocer")}
            <svg
              className="w-3 h-3 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}