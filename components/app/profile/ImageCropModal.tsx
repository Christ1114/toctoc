"use client";
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { useTranslations } from "next-intl";
import { XIcon, CheckIcon } from "@phosphor-icons/react";
import { orbitron } from "@/fonts/font";
import { getCroppedImageBlob, type CropArea } from "@/lib/cropImage";
interface ImageCropModalProps {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
  processing?: boolean;
}
export default function ImageCropModal({
  imageSrc,
  onCancel,
  onConfirm,
  processing = false,
}: ImageCropModalProps) {
  const t = useTranslations("ProfilePage");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const onCropComplete = useCallback((_croppedArea: CropArea, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);
  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
    onConfirm(blob);
  };
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 dark:border-white/5">
          <h2 className={`text-sm font-medium text-gray-900 dark:text-white/90 ${orbitron.className}`}>
            {t("cropTitle")}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-900 dark:text-white/40 dark:hover:text-white/90 cursor-pointer"
            aria-label={t("cancel")}
          >
            <XIcon size={18} />
          </button>
        </div>
        <div className="relative w-full h-80 bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="px-4 py-3 flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-white/40 shrink-0">{t("zoom")}</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[#432dd7]"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 dark:border-white/5">
          <button
            onClick={onCancel}
            disabled={processing}
            className={`flex-1 h-10 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer disabled:opacity-40 transition-colors ${orbitron.className}`}
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing || !croppedAreaPixels}
            className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg bg-[#432dd7] hover:bg-[#432dd7]/90 text-sm text-white cursor-pointer disabled:opacity-50 transition-colors ${orbitron.className}`}
          >
            <CheckIcon size={14} weight="bold" />
            {processing ? t("saving") : t("cropConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}