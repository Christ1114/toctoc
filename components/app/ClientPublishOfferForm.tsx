"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BriefcaseIcon,
  CurrencyCircleDollarIcon,
  MapPinIcon,
  TextAlignLeftIcon,
  XIcon,
} from "@phosphor-icons/react";
import { orbitron } from "@/fonts/font";

/* ═══════════════ Types ═══════════════ */

type JobType = {
  id: string;
  name: string;
  slug: string;
  category: string;
};

type Region = {
  id: string;
  name: string;
  slug: string;
};

type EditableAnnouncement = {
  id: string;
  title: string;
  description: string | null;
  salaryMin: number | null;
  salaryPeriod: string | null;
  city: string | null;
  jobType: { id: string; name: string; slug: string } | null;
  region: { id: string; name: string; slug: string } | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  announcement?: EditableAnnouncement | null;
};

/* ═══════════════ Cache module-level des référentiels ═══════════════
   Chargés une seule fois par session, réutilisés sur toutes les
   ouvertures de la modale. Évite 10 fetchs si l'user ouvre 5 fois.
   ═══════════════════════════════════════════════════════════════════ */

let cachedJobTypes: JobType[] | null = null;
let cachedRegions: Region[] | null = null;
let optionsPromise: Promise<{ jobTypes: JobType[]; regions: Region[] }> | null = null;

async function loadReferentials() {
  if (cachedJobTypes && cachedRegions) {
    return { jobTypes: cachedJobTypes, regions: cachedRegions };
  }
  if (optionsPromise) return optionsPromise;

  optionsPromise = Promise.all([
    fetch("/api/regions/job-types").then((r) => r.json()),
    fetch("/api/regions/fields").then((r) => r.json()),
  ])
    .then(([jt, rg]) => {
      cachedJobTypes = jt.jobTypes || [];
      cachedRegions = rg.regions || [];
      return { jobTypes: cachedJobTypes!, regions: cachedRegions! };
    })
    .catch((err) => {
      optionsPromise = null;
      throw err;
    });

  return optionsPromise;
}



export default function ClientPublishOfferForm({
  open,
  onClose,
  onSuccess,
  announcement,
}: Props) {
 const t = useTranslations("ProfilePage");
  const isEdit = !!announcement;

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLSelectElement>(null);
  const submittingRef = useRef(false); // anti double-submit immédiat

  const [jobTypes, setJobTypes] = useState<JobType[]>(cachedJobTypes ?? []);
  const [regions, setRegions] = useState<Region[]>(cachedRegions ?? []);
  const [loadingOptions, setLoadingOptions] = useState(!cachedJobTypes);

  const [jobTypeId, setJobTypeId] = useState("");
  const [description, setDescription] = useState("");
  const [salaryMin, setSalaryMin] = useState<number | "">("");
  const [regionId, setRegionId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ─── Charger les options ─── */
  useEffect(() => {
    if (!open) return;

    if (cachedJobTypes && cachedRegions) {
      setJobTypes(cachedJobTypes);
      setRegions(cachedRegions);
      setLoadingOptions(false);
      return;
    }

    let cancelled = false;
    setLoadingOptions(true);

    loadReferentials()
      .then(({ jobTypes: jt, regions: rg }) => {
        if (cancelled) return;
        setJobTypes(jt);
        setRegions(rg);
      })
      .catch(() => {
        if (cancelled) return;
        setError(t("errors.optionsLoadFailed"));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingOptions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, t]);

  /* ─── Préremplir / reset ─── */
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (announcement) {
      setJobTypeId(announcement.jobType?.id ?? "");
      setDescription(announcement.description ?? "");
      setSalaryMin(announcement.salaryMin ?? "");
      setRegionId(announcement.region?.id ?? "");
    } else {
      setJobTypeId("");
      setDescription("");
      setSalaryMin("");
      setRegionId("");
    }
  }, [open, announcement]);

  /* ─── Focus initial ─── */
  useEffect(() => {
    if (!open) return;
    // Délai pour laisser le DOM se monter + animation
    const id = setTimeout(() => firstFieldRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, [open]);

  /* ─── Bloquer le scroll du body ─── */
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  /* ─── Escape pour fermer + focus trap ─── */
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape → fermer (sauf pendant submit)
      if (e.key === "Escape") {
        if (!submittingRef.current) {
          e.preventDefault();
          onClose();
        }
        return;
      }

      // Focus trap (Tab)
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  /* ─── Soumission ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Anti double-submit synchrone (avant que React ne disable le bouton)
    if (submittingRef.current) return;

    setError(null);

    // Validation client
    if (!jobTypeId) return setError(t("errors.jobTypeRequired"));
    if (!regionId) return setError(t("errors.regionRequired"));
    if (typeof salaryMin !== "number" || salaryMin < 10000) {
      return setError(t("errors.salaryMin"));
    }

    const selectedJobType = jobTypes.find((j) => j.id === jobTypeId);
    const selectedRegion = regions.find((r) => r.id === regionId);

    submittingRef.current = true;
    setSubmitting(true);

    try {
      const url = isEdit
        ? `/api/announcements/${announcement!.id}`
        : "/api/announcements";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedJobType?.name || announcement?.title || "",
          description,
          jobTypeId,
          salaryMin,
          regionId,
          city: selectedRegion?.name || "",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("errors.submitFailed"));
      }

      // ✅ Fermer AVANT d'appeler onSuccess (ordre inversé)
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.submitFailed"));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  /* ─── Clic sur backdrop ─── */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !submittingRef.current) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 sm:px-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-offer-title"
        aria-busy={submitting}
        dir="auto"
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-xl ${orbitron.className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <h2
            id="publish-offer-title"
            className={`text-sm sm:text-base font-semibold text-gray-900 dark:text-white/90 ${orbitron.className}`}
          >
            {isEdit ? t("editTitle") : t("title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-700 dark:text-white/50 dark:hover:text-white/90 cursor-pointer p-1 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={t("close")}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="px-4 sm:px-6 py-5 flex flex-col gap-5"
          noValidate
        >
          {/* Poste */}
          <div>
            <label
              htmlFor="publish-job-type"
              className={`flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-500 dark:text-white/50 mb-1.5 ${orbitron.className}`}
            >
              <BriefcaseIcon size={14} />
              {t("fields.jobType")}
            </label>
            <select
              id="publish-job-type"
              ref={firstFieldRef}
              value={jobTypeId}
              onChange={(e) => setJobTypeId(e.target.value)}
              disabled={loadingOptions || submitting}
              className={`w-full h-10 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm text-gray-900 dark:text-white/90 px-3 focus:outline-none focus:border-[#432dd7]/60 transition-colors disabled:opacity-50 ${orbitron.className}`}
            >
              <option value="">{t("fields.jobTypePlaceholder")}</option>
              {jobTypes.map((jt) => (
                <option key={jt.id} value={jt.id}>
                  {jt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="publish-description"
              className={`flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-500 dark:text-white/50 mb-1.5 ${orbitron.className}`}
            >
              <TextAlignLeftIcon size={14} />
              {t("fields.description")}
            </label>
            <textarea
              id="publish-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={5000}
              disabled={submitting}
              placeholder={t("fields.descriptionPlaceholder")}
              className={`w-full rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm text-gray-900 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 p-3 focus:outline-none focus:border-[#432dd7]/60 transition-colors resize-none disabled:opacity-50 ${orbitron.className}`}
            />
            <p className={`text-[10px] text-right text-gray-400 dark:text-white/40 mt-1 ${orbitron.className}`}>
              {description.length} / 5000
            </p>
          </div>

          {/* Salaire + Localisation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="publish-salary"
                className={`flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-500 dark:text-white/50 mb-1.5 ${orbitron.className}`}
              >
                <CurrencyCircleDollarIcon size={14} />
                {t("fields.salary")}
              </label>
              <div className="relative">
                <input
                  id="publish-salary"
                  type="number"
                  min={10000}
                  max={10_000_000}
                  step={500}
                  value={salaryMin}
                  onChange={(e) =>
                    setSalaryMin(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  disabled={submitting}
                  placeholder="10000"
                  className={`w-full h-10 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm text-gray-900 dark:text-white/90 px-3 pr-12 focus:outline-none focus:border-[#432dd7]/60 transition-colors disabled:opacity-50 ${orbitron.className}`}
                />
                <span
                  className={`absolute top-1/2 -translate-y-1/2 right-3 text-xs text-gray-400 dark:text-white/40 pointer-events-none ${orbitron.className}`}
                >
                  FCFA
                </span>
              </div>
              <p
                className={`text-[10px] text-gray-400 dark:text-white/40 mt-1 ${orbitron.className}`}
              >
                {t("fields.salaryHint")}
              </p>
            </div>

            <div>
              <label
                htmlFor="publish-region"
                className={`flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-500 dark:text-white/50 mb-1.5 ${orbitron.className}`}
              >
                <MapPinIcon size={14} />
                {t("fields.region")}
              </label>
              <select
                id="publish-region"
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                disabled={loadingOptions || submitting}
                className={`w-full h-10 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm text-gray-900 dark:text-white/90 px-3 focus:outline-none focus:border-[#432dd7]/60 transition-colors disabled:opacity-50 ${orbitron.className}`}
              >
                <option value="">{t("fields.regionPlaceholder")}</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <p
              role="alert"
              className={`text-sm text-red-500 dark:text-red-400/80 ${orbitron.className}`}
            >
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`h-10 px-4 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-sm text-gray-900 dark:text-white/90 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${orbitron.className}`}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting || loadingOptions}
              className={`flex items-center gap-2 h-10 px-4 rounded-lg bg-[#432dd7] hover:bg-[#432dd7]/90 text-sm text-white cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${orbitron.className}`}
            >
              {submitting && (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
              )}
              {submitting
                ? isEdit
                  ? t("saving")
                  : t("submitting")
                : isEdit
                ? t("save")
                : t("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}