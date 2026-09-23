export type AvatarMarkerOptions = {
  imageUrl?: string | null;
  fallbackLabel: string;
  color?: string;
  isOnline?: boolean;
  bio?: string | null;
  username?: string | null;
  lastSeenAt?: Date | null;
  onClick?: () => void;
  size?: number;
  labels?: {
    online?: string;
    offline?: string;
    justNow?: string;
    minutesAgo?: (n: number) => string;
    hoursAgo?: (n: number) => string;
    daysAgo?: (n: number) => string;
  };
};
const SAFE_IMAGE_PROTOCOLS = new Set(["https:", "http:"]);
const DEFAULT_COLOR = "#432dd7";
const TAP_MAX_MOVEMENT_PX = 10;
const TAP_MAX_DURATION_MS = 500;
function isSafeImageUrl(url: string): boolean {
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    const parsed = new URL(url);
    return SAFE_IMAGE_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}
function sanitizeColor(raw: string | undefined): string {
  if (!raw) return DEFAULT_COLOR;
  const trimmed = raw.trim();
  if (!trimmed) return DEFAULT_COLOR;
  // Hex
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
  // rgb / rgba / hsl / hsla
  if (/^(rgb|rgba|hsl|hsla)\(\s*[\d.,%\s/]+\)$/i.test(trimmed)) return trimmed;
  // Couleurs nommées CSS
  if (/^[a-z-]{1,30}$/i.test(trimmed)) return trimmed;
  return DEFAULT_COLOR;
}
function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `tooltip-${crypto.randomUUID()}`;
  }
  return `tooltip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
function formatLastSeen(
  date: Date | null | undefined,
  labels?: AvatarMarkerOptions["labels"],
): string | null {
  if (!date) return null;
  const diff = Date.now() - date.getTime();
  if (diff < 0) return null;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return labels?.justNow ?? "À l'instant";
  if (minutes < 60) {
    return labels?.minutesAgo
      ? labels.minutesAgo(minutes)
      : `Vu il y a ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return labels?.hoursAgo ? labels.hoursAgo(hours) : `Vu il y a ${hours} h`;
  }
  const days = Math.floor(hours / 24);
  return labels?.daysAgo ? labels.daysAgo(days) : `Vu il y a ${days} j`;
}
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
/* ─── Factory ─── */
export function createAvatarMarkerElement({
  imageUrl,
  fallbackLabel,
  color = DEFAULT_COLOR,
  isOnline = false,
  bio,
  username,
  lastSeenAt,
  onClick,
  size,
  labels,
}: AvatarMarkerOptions): HTMLDivElement {
  /* ═══════════════════════════════════════════════════════
     WRAPPER
     ═══════════════════════════════════════════════════════ */
  const wrapper = el("div", "avatar-marker");
  wrapper.dataset.online = isOnline ? "1" : "0";
  const safeColor = sanitizeColor(color);
  wrapper.style.setProperty("--marker-color", safeColor);
  const bubbleSize = size ?? 52;
  wrapper.style.setProperty("--bubble-size", `${bubbleSize}px`);
  wrapper.style.setProperty("--ring-size", `${bubbleSize + 16}px`);
  // Toujours interactif côté DOM (peu importe onClick)
  wrapper.style.pointerEvents = "auto";
  wrapper.style.touchAction = "manipulation";
  if (onClick) {
    wrapper.setAttribute("role", "button");
    wrapper.setAttribute("tabindex", "0");
    wrapper.style.cursor = "pointer";
    if (username) wrapper.setAttribute("aria-label", username);
  }
  /* ═══════════════════════════════════════════════════════
     PULSE RING (online uniquement)
     ═══════════════════════════════════════════════════════ */
  const pulseRing = el("div", "avatar-marker__pulse");
  pulseRing.setAttribute("aria-hidden", "true");
  if (!isOnline) pulseRing.style.display = "none";
  /* ═══════════════════════════════════════════════════════
     BUBBLE (avatar)
     ═══════════════════════════════════════════════════════ */
  const bubble = el("div", "avatar-marker__bubble");
  const initial = fallbackLabel.charAt(0).toUpperCase();
  const fallback = el("span", "avatar-marker__fallback", initial);
  let img: HTMLImageElement | null = null;
  if (imageUrl && isSafeImageUrl(imageUrl)) {
    img = document.createElement("img");
    img.className = "avatar-marker__img";
    img.alt = "";
    img.decoding = "async";
    img.loading = "lazy";
    img.draggable = false;
    img.addEventListener("load", () => {
      fallback.hidden = true;
    });
    img.addEventListener("error", () => {
      img?.remove();
    });
    img.src = imageUrl;
  } else {
    fallback.hidden = false;
  }
  bubble.append(...([img, fallback].filter(Boolean) as HTMLElement[]));
  /* ═══════════════════════════════════════════════════════
     STATUS DOT
     ═══════════════════════════════════════════════════════ */
  const status = el(
    "span",
    `avatar-marker__status ${isOnline ? "is-online" : "is-offline"}`,
  );
  const statusLabel = isOnline
    ? labels?.online ?? "En ligne"
    : labels?.offline ?? "Hors ligne";
  status.setAttribute("aria-label", statusLabel);
  status.setAttribute("title", statusLabel);
  bubble.appendChild(status);
  /* ═══════════════════════════════════════════════════════
     POINTER + SHADOW
     ═══════════════════════════════════════════════════════ */
  const pointer = el("div", "avatar-marker__pointer");
  const shadow = el("div", "avatar-marker__shadow");
  wrapper.append(pulseRing, bubble, pointer, shadow);
  /* ═══════════════════════════════════════════════════════
     TOOLTIP
     ═══════════════════════════════════════════════════════ */
  const lastSeenText = !isOnline ? formatLastSeen(lastSeenAt, labels) : null;
  const hasTooltip = !!(username || bio || lastSeenText);
  if (hasTooltip) {
    const tooltip = el("div", "avatar-marker__tooltip");
    tooltip.setAttribute("role", "tooltip");
    if (username) {
      tooltip.appendChild(el("strong", "avatar-marker__name", username));
    }
    if (bio) {
      tooltip.appendChild(el("p", "avatar-marker__bio", bio));
    }
    if (lastSeenText) {
      tooltip.appendChild(el("span", "avatar-marker__lastseen", lastSeenText));
    }
    const tooltipId = generateId();
    tooltip.id = tooltipId;
    wrapper.setAttribute("aria-describedby", tooltipId);
    wrapper.appendChild(tooltip);
  }
  /* ═══════════════════════════════════════════════════════
     HANDLERS (avec anti "tap fantôme" mobile)
     ═══════════════════════════════════════════════════════ */
  if (onClick) {
    let pointerStart: { x: number; y: number; t: number } | null = null;
    // Bloque le drag de la carte dès le pointerdown
    wrapper.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      pointerStart = { x: e.clientX, y: e.clientY, t: Date.now() };
    });
    // ✅ Anti "tap fantôme" : on ne déclenche le clic que si
    //    l'utilisateur a bougé < 10px ET en < 500ms
    //    (empêche le clic lors d'un swipe/pan rapide)
    wrapper.addEventListener("pointerup", (e) => {
      if (!pointerStart) return;
      const dx = Math.abs(e.clientX - pointerStart.x);
      const dy = Math.abs(e.clientY - pointerStart.y);
      const dt = Date.now() - pointerStart.t;
      pointerStart = null;
      if (dx < TAP_MAX_MOVEMENT_PX && dy < TAP_MAX_MOVEMENT_PX && dt < TAP_MAX_DURATION_MS) {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }
    });
    // Reset si le pointeur sort (cancel)
    wrapper.addEventListener("pointercancel", () => {
      pointerStart = null;
    });
    wrapper.addEventListener("pointerleave", () => {
      pointerStart = null;
    });
    // ✅ Fallback clavier
    wrapper.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }
    });
  }
  return wrapper;
}