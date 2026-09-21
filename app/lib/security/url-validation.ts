

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
export function isSafeUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const u = new URL(raw);
    return ALLOWED_PROTOCOLS.has(u.protocol);
  } catch {
    return false;
  }
}
export function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const withProto = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return isSafeUrl(withProto) ? withProto : null;
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&/]+)/,
    /youtube\.com\/watch\?v=([^?&/]+)/,
    /youtube\.com\/embed\/([^?&/]+)/,
    /youtube\.com\/shorts\/([^?&/]+)/,
  ];

  for (const p of patterns) {
    const m = url.match(p);
    if (m) {
      const id = m[1];
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
  }
  return null;
}
export function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (!m) return null;
  const id = m[1];
  return /^\d{6,12}$/.test(id) ? id : null;
}
export function isDirectVideoUrl(url: string): boolean {
  if (!isSafeUrl(url)) return false;
  try {
    const u = new URL(url);
    return /\.(mp4|webm|ogg)$/i.test(u.pathname);
  } catch {
    return false;
  }
}

export type VideoPlatform = "youtube" | "vimeo" | "direct";

export type ParsedVideo =
  | {
      ok: true;
      platform: VideoPlatform;
      externalId: string | null;
      thumbnail: string | null;
    }
  | { ok: false; reason: string };
export function parseVideoUrl(raw: string): ParsedVideo {
  const normalized = normalizeUrl(raw);
  if (!normalized) {
    return { ok: false, reason: "URL invalide ou non sécurisée" };
  }

  const yt = extractYouTubeId(normalized);
  if (yt) {
    return {
      ok: true,
      platform: "youtube",
      externalId: yt,
      thumbnail: `https://img.youtube.com/vi/${yt}/hqdefault.jpg`,
    };
  }

  const vimeo = extractVimeoId(normalized);
  if (vimeo) {
    return {
      ok: true,
      platform: "vimeo",
      externalId: vimeo,
      thumbnail: null,
    };
  }

  if (isDirectVideoUrl(normalized)) {
    return {
      ok: true,
      platform: "direct",
      externalId: null,
      thumbnail: null,
    };
  }

  return {
    ok: false,
    reason: "Format vidéo non supporté (YouTube, Vimeo, MP4, WebM)",
  };
}