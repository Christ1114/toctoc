"use client";

import { useEffect } from "react";

type PopoverProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  widthClassName?: string;
};

export default function Popover({ open, onClose, title, children, widthClassName }: PopoverProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[calc(100vw-2rem)] rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900/95 backdrop-blur-xl shadow-2xl p-5 ${
          widthClassName || "w-90"
        }`}
      >
        {children}
      </div>
    </>
  );
}