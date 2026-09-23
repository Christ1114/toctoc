"use client";
import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  VideoCameraIcon,
  CheckIcon,
  XIcon,
  SpinnerGapIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { orbitron } from "@/fonts/font";
import { isSafeUrl } from "@/app/lib/security/url-validation";
type ManagedVideo = {
  id: string;
  url: string;
  platform: string;
  externalId: string | null;
  thumbnail: string | null;
  title: string | null;
  description: string | null;
  position: number;
  isVisible: boolean;
  createdAt: string;
};
export default function VideoManager() {
  const t = useTranslations("VideoManager");
  const [videos, setVideos] = useState<ManagedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // ─── Chargement initial ───
  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/providers/me/videos");
      if (!res.ok) throw new Error("fetch_failed");
      const data = await res.json();
      setVideos(data.videos ?? []);
    } catch {
      setError(t("errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);
  useEffect(() => {
    loadVideos();
  }, [loadVideos]);
  // ─── Helpers ───
  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };
  const handleAdd = async (url: string, title: string, description: string) => {
    setError(null);
    // Validation client rapide (le serveur revalide)
    if (!isSafeUrl(url)) {
      setError(t("errors.invalidUrl"));
      return;
    }
    try {
      setBusyId("new");
      const res = await fetch("/api/providers/me/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          title: title || undefined,
          description: description || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("errors.addFailed"));
        return;
      }
      setVideos((prev) => [...prev, data.video]);
      setAdding(false);
      showSuccess(t("added"));
    } catch {
      setError(t("errors.addFailed"));
    } finally {
      setBusyId(null);
    }
  };
  const handleUpdate = async (
    id: string,
    patch: { title?: string | null; description?: string | null; isVisible?: boolean }
  ) => {
    setError(null);
    setBusyId(id);
    // Optimistic update
    const previous = videos;
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...patch } : v))
    );
    try {
      const res = await fetch(`/api/providers/me/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json();
        setVideos(previous); // rollback
        setError(data.error ?? t("errors.updateFailed"));
        return;
      }
      const data = await res.json();
      setVideos((prev) => prev.map((v) => (v.id === id ? data.video : v)));
      setEditingId(null);
      showSuccess(t("updated"));
    } catch {
      setVideos(previous); // rollback
      setError(t("errors.updateFailed"));
    } finally {
      setBusyId(null);
    }
  };
  const handleDelete = async (id: string) => {
    setError(null);
    setBusyId(id);
    // Optimistic
    const previous = videos;
    setVideos((prev) => prev.filter((v) => v.id !== id));
    try {
      const res = await fetch(`/api/providers/me/videos/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setVideos(previous); // rollback
        setError(data.error ?? t("errors.deleteFailed"));
        return;
      }
      setDeletingId(null);
      showSuccess(t("deleted"));
    } catch {
      setVideos(previous);
      setError(t("errors.deleteFailed"));
    } finally {
      setBusyId(null);
    }
  };
  // ─── Rendu ───
  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <SpinnerGapIcon
          size={28}
          className="animate-spin text-gray-400 dark:text-white/30"
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {/* Feedback */}
      {error && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs sm:text-sm">
          <WarningIcon size={16} className="shrink-0 mt-0.5" />
          <p className="flex-1">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs sm:text-sm">
          <CheckIcon size={16} weight="bold" className="shrink-0" />
          <p className="flex-1">{success}</p>
        </div>
      )}
      {/* Bouton ajouter */}
      {!adding && videos.length < 20 && (
        <button
          onClick={() => setAdding(true)}
          className={`self-start flex items-center gap-2 h-10 px-4 rounded-lg bg-[#432dd7] hover:bg-[#432dd7]/90 text-white text-xs sm:text-sm font-medium cursor-pointer transition-colors ${orbitron.className}`}
        >
          <PlusIcon size={16} weight="bold" />
          {t("addVideo")}
        </button>
      )}
      {/* Formulaire d'ajout */}
      {adding && (
        <AddVideoForm
          onCancel={() => setAdding(false)}
          onSubmit={handleAdd}
          busy={busyId === "new"}
          t={t}
        />
      )}
      {/* Liste vide */}
      {videos.length === 0 && !adding && (
        <div className="py-10 flex flex-col items-center text-center">
          <VideoCameraIcon
            size={32}
            className="text-gray-300 dark:text-white/20 mb-2"
          />
          <p
            className={`text-sm text-gray-400 dark:text-white/40 ${orbitron.className}`}
          >
            {t("empty")}
          </p>
        </div>
      )}
      {/* Liste des vidéos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {videos.map((video) =>
          editingId === video.id ? (
            <EditVideoCard
              key={video.id}
              video={video}
              onCancel={() => setEditingId(null)}
              onSave={(patch) => handleUpdate(video.id, patch)}
              busy={busyId === video.id}
              t={t}
            />
          ) : (
            <VideoCard
              key={video.id}
              video={video}
              onEdit={() => setEditingId(video.id)}
              onDelete={() => setDeletingId(video.id)}
              onToggleVisible={() =>
                handleUpdate(video.id, { isVisible: !video.isVisible })
              }
              busy={busyId === video.id}
              t={t}
            />
          )
        )}
      </div>
      {/* Confirmation suppression */}
      {deletingId && (
        <ConfirmDeleteModal
          onCancel={() => setDeletingId(null)}
          onConfirm={() => handleDelete(deletingId)}
          busy={busyId === deletingId}
          t={t}
        />
      )}
    </div>
  );
}
/* ═══════════════ Sous-composants ═══════════════ */
function VideoCard({
  video,
  onEdit,
  onDelete,
  onToggleVisible,
  busy,
  t,
}: {
  video: ManagedVideo;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisible: () => void;
  busy: boolean;
  t: any;
}) {
  return (
    <div className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
      <div className="relative aspect-video bg-gray-100 dark:bg-white/5">
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <VideoCameraIcon size={28} className="text-gray-300 dark:text-white/20" />
          </div>
        )}
        {!video.isVisible && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] flex items-center gap-1">
            <EyeSlashIcon size={12} />
            {t("hidden")}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white/90 line-clamp-1">
          {video.title || t("untitled")}
        </p>
        {video.description && (
          <p className="text-xs text-gray-500 dark:text-white/50 line-clamp-2 mt-1">
            {video.description}
          </p>
        )}
        <div className="flex items-center gap-1 mt-3">
          <button
            onClick={onEdit}
            disabled={busy}
            aria-label={t("edit")}
            className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-600 dark:text-white/60 cursor-pointer disabled:opacity-40 transition-colors"
          >
            <PencilIcon size={14} />
          </button>
          <button
            onClick={onToggleVisible}
            disabled={busy}
            aria-label={video.isVisible ? t("hide") : t("show")}
            className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-600 dark:text-white/60 cursor-pointer disabled:opacity-40 transition-colors"
          >
            {video.isVisible ? <EyeIcon size={14} /> : <EyeSlashIcon size={14} />}
          </button>
          <button
            onClick={onDelete}
            disabled={busy}
            aria-label={t("delete")}
            className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center text-red-500 cursor-pointer disabled:opacity-40 transition-colors ml-auto"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
function AddVideoForm({
  onCancel,
  onSubmit,
  busy,
  t,
}: {
  onCancel: () => void;
  onSubmit: (url: string, title: string, description: string) => void;
  busy: boolean;
  t: any;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || busy) return;
    onSubmit(url.trim(), title.trim(), description.trim());
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4 flex flex-col gap-3"
    >
      <div>
        <label className="block text-[10px] sm:text-xs text-gray-500 dark:text-white/50 mb-1">
          {t("form.url")} <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          disabled={busy}
          className="w-full h-10 px-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-[#432dd7] disabled:opacity-50"
        />
        <p className="text-[10px] text-gray-400 dark:text-white/30 mt-1">
          {t("form.urlHint")}
        </p>
      </div>
      <div>
        <label className="block text-[10px] sm:text-xs text-gray-500 dark:text-white/50 mb-1">
          {t("form.title")}
        </label>
        <input
          type="text"
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          disabled={busy}
          className="w-full h-10 px-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white/90 focus:outline-none focus:border-[#432dd7] disabled:opacity-50"
        />
      </div>
      <div>
        <label className="block text-[10px] sm:text-xs text-gray-500 dark:text-white/50 mb-1">
          {t("form.description")}
        </label>
        <textarea
          value={description}
          maxLength={500}
          rows={2}
          onChange={(e) => setDescription(e.target.value)}
          disabled={busy}
          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white/90 resize-none focus:outline-none focus:border-[#432dd7] disabled:opacity-50"
        />
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-gray-200 dark:border-white/10 text-xs sm:text-sm text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer disabled:opacity-40"
        >
          <XIcon size={14} />
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={busy || !url.trim()}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#432dd7] hover:bg-[#432dd7]/90 text-white text-xs sm:text-sm cursor-pointer disabled:opacity-50"
        >
          {busy ? (
            <SpinnerGapIcon size={14} className="animate-spin" />
          ) : (
            <CheckIcon size={14} weight="bold" />
          )}
          {t("form.submit")}
        </button>
      </div>
    </form>
  );
}
function EditVideoCard({
  video,
  onCancel,
  onSave,
  busy,
  t,
}: {
  video: ManagedVideo;
  onCancel: () => void;
  onSave: (patch: { title: string | null; description: string | null }) => void;
  busy: boolean;
  t: any;
}) {
  const [title, setTitle] = useState(video.title ?? "");
  const [description, setDescription] = useState(video.description ?? "");
  const handleSave = () => {
    if (busy) return;
    onSave({
      title: title.trim() || null,
      description: description.trim() || null,
    });
  };
  return (
    <div className="rounded-xl border border-[#432dd7] bg-white dark:bg-white/5 p-3 flex flex-col gap-2">
      <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5">
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <VideoCameraIcon size={28} className="text-gray-300 dark:text-white/20" />
          </div>
        )}
      </div>
      <input
        type="text"
        value={title}
        maxLength={120}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("form.title")}
        disabled={busy}
        className="w-full h-9 px-3 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white/90 focus:outline-none focus:border-[#432dd7] disabled:opacity-50"
      />
      <textarea
        value={description}
        maxLength={500}
        rows={2}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t("form.description")}
        disabled={busy}
        className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white/90 resize-none focus:outline-none focus:border-[#432dd7] disabled:opacity-50"
      />
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onCancel}
          disabled={busy}
          className="h-8 px-3 rounded-lg text-xs text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer disabled:opacity-40"
        >
          {t("cancel")}
        </button>
        <button
          onClick={handleSave}
          disabled={busy}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#432dd7] hover:bg-[#432dd7]/90 text-white text-xs cursor-pointer disabled:opacity-50"
        >
          {busy && <SpinnerGapIcon size={12} className="animate-spin" />}
          {t("save")}
        </button>
      </div>
    </div>
  );
}
function ConfirmDeleteModal({
  onCancel,
  onConfirm,
  busy,
  t,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
  t: any;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, busy]);
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={() => !busy && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white dark:bg-zinc-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-gray-900 dark:text-white/90 mb-2">
          {t("confirmDelete.title")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-white/50 mb-4">
          {t("confirmDelete.message")}
        </p>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={busy}
            className="h-9 px-4 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer disabled:opacity-40"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm cursor-pointer disabled:opacity-50"
          >
            {busy && <SpinnerGapIcon size={14} className="animate-spin" />}
            {t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}