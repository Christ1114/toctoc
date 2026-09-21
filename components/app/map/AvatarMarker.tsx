

export type AvatarMarkerOptions = {
  imageUrl?: string | null;
  fallbackLabel: string;
  color?: string;
  isOnline?: boolean;
  bio?: string | null;
  username?: string | null;
  lastSeenAt?: Date | null;
  onClick?: () => void;

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
  const DEFAULT = "#432dd7";
  if (!raw) return DEFAULT;

  const trimmed = raw.trim();
  if (!trimmed) return DEFAULT;


  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;

  
  if (/^(rgb|rgba|hsl|hsla)\(\s*[\d.,%\s/]+\)$/i.test(trimmed)) return trimmed;

  
  if (/^[a-z-]{1,30}$/i.test(trimmed)) return trimmed;

  return DEFAULT;
}


function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `tooltip-${crypto.randomUUID()}`;
  }
  return `tooltip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}


function formatLastSeen(
  date: Date | null | undefined,
  labels?: AvatarMarkerOptions["labels"]
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
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}


export function createAvatarMarkerElement({
  imageUrl,
  fallbackLabel,
  color = "#432dd7",
  isOnline = false,
  bio,
  username,
  lastSeenAt,
  onClick,
  labels,
}: AvatarMarkerOptions): HTMLDivElement {
  const wrapper = el("div", "avatar-marker");
  const safeColor = sanitizeColor(color);
  wrapper.style.setProperty("--marker-color", safeColor);

  // ─── Accessibilité : seulement si le marker est interactif ───
  if (onClick) {
    wrapper.setAttribute("role", "button");
    wrapper.setAttribute("tabindex", "0");
    wrapper.style.cursor = "pointer";
    wrapper.style.pointerEvents = "auto";
    if (username) {
      wrapper.setAttribute("aria-label", username);
    }
  }


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

  
  const status = el(
    "span",
    `avatar-marker__status ${isOnline ? "is-online" : "is-offline"}`
  );
  const statusLabel = isOnline
    ? labels?.online ?? "En ligne"
    : labels?.offline ?? "Hors ligne";
  status.setAttribute("aria-label", statusLabel);
  status.setAttribute("title", statusLabel);
  bubble.appendChild(status);


  const pointer = el("div", "avatar-marker__pointer");
  const shadow = el("div", "avatar-marker__shadow");

  wrapper.append(bubble, pointer, shadow);


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
      tooltip.appendChild(
        el("span", "avatar-marker__lastseen", lastSeenText)
      );
    }

    const tooltipId = generateId();
    tooltip.id = tooltipId;
    wrapper.setAttribute("aria-describedby", tooltipId);

    wrapper.appendChild(tooltip);
  }

  if (onClick) {
    const stop = (e: Event) => e.stopPropagation();
    wrapper.addEventListener("mousedown", stop);
    wrapper.addEventListener("touchstart", stop, { passive: true });
    wrapper.addEventListener("pointerdown", stop);
    wrapper.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
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