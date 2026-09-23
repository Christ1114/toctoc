import { orbitron } from "@/fonts/font";

/* ═══════════════ ReadField ═══════════════ */
function ReadField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
      <span className={`text-xs sm:text-sm text-gray-500 dark:text-white/50 shrink-0 ${orbitron.className}`}>
        {label}
      </span>
      <span className={`text-sm text-gray-900 dark:text-white/90 truncate ${orbitron.className}`}>
        {value || "—"}
      </span>
    </div>
  );
}