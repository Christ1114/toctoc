"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { VirtualRealityIcon, XIcon } from "@phosphor-icons/react";
import Popover from "../utils/Popover";
import { orbitron } from "@/fonts/font";

type VrConfirmPopoverProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function VrConfirmPopover({ open, onClose, onConfirm }: VrConfirmPopoverProps) {
  const t = useTranslations("VrConfirmPopover");
  const [checked, setChecked] = useState(false);

  const handleContinue = () => {
    if (!checked) return;
    onConfirm();
    onClose();
  };

  return (
    <Popover open={open} onClose={onClose} title={t("title")}>
      <div className={`flex items-center justify-between mb-4 ${orbitron.className} antialiased`}>
        <div className="flex items-center gap-2">
          <VirtualRealityIcon size={18} className="text-[#432dd7] shrink-0" />
          <h2 className={`text-sm font-medium text-gray-900 dark:text-white/90 ${orbitron.className} antialiased`}>
            {t("title")}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 dark:text-white/50 dark:hover:text-white/90 cursor-pointer shrink-0 ml-4"
          aria-label={t("close")}
        >
          <XIcon size={18} />
        </button>
      </div>

      <p className={`text-sm text-gray-600 dark:text-white/60 mb-4 ${orbitron.className} antialiased`}>
        {t("description")}
      </p>

      <label className="flex items-start gap-3 mb-5 cursor-pointer group">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 accent-[#432dd7] cursor-pointer shrink-0 w-4 h-4"
        />
        <span className={`text-sm text-gray-700 dark:text-white/70 ${orbitron.className} group-hover:text-gray-900 dark:group-hover:text-white/90 transition-colors`}>
          {t("checkboxLabel")}
        </span>
      </label>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          onClick={onClose}
          className={`w-full sm:flex-1 h-10 px-4 rounded-lg text-sm text-gray-700 dark:text-white/70 border border-gray-300 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors ${orbitron.className}`}
        >
          {t("cancel")}
        </button>
        <button
          onClick={handleContinue}
          disabled={!checked}
          className={`w-full sm:flex-1 h-10 px-4 rounded-lg text-sm text-white bg-[#432dd7] hover:bg-[#432dd7]/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors ${orbitron.className}`}
        >
          {t("continue")}
        </button>
      </div>
    </Popover>
  );
}