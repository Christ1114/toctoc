

export type AvatarMarkerOptions = {
  imageUrl?: string | null;
  fallbackLabel: string;
  color?: string;
  isOnline?: boolean;
  bio?: string | null;
  username?: string | null;
  lastSeenAt?: Date | null;
  onClick?: () => void;
};


const SAFE_IMAGE_PROTOCOLS = new Set(["https:"]);

function isSafeImageUrl(url: string): boolean {
  if (url.startsWith("/") && !url.startsWith("//")) return true; 
  try {
    const parsed = new URL(url);
    return SAFE_IMAGE_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}


function formatLastSeen(date: Date | null | undefined): string | null {
  if (!date) return null;
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Vu il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Vu il y a ${hours} h`;
  return `Vu il y a ${Math.floor(hours / 24)} j`;
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
}: AvatarMarkerOptions): HTMLDivElement {
  const wrapper = el("div", "avatar-marker");
  wrapper.setAttribute("role", "button");
  wrapper.setAttribute("tabindex", "0");
  wrapper.style.setProperty("--marker-color", color); 

 
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

  bubble.append(...[img, fallback].filter(Boolean) as HTMLElement[]);

  // ─── Pastille statut ───
  const status = el("span", `avatar-marker__status ${isOnline ? "is-online" : "is-offline"}`);
  status.setAttribute("aria-label", isOnline ? "En ligne" : "Hors ligne");
  bubble.appendChild(status);

  // ─── Pointeur + ombre ───
  const pointer = el("div", "avatar-marker__pointer");
  const shadow = el("div", "avatar-marker__shadow");

  wrapper.append(bubble, pointer, shadow);

  // ─── Tooltip (créé seulement si contenu) ───
  const lastSeenText = !isOnline ? formatLastSeen(lastSeenAt) : null;
  const hasTooltip = !!(username || bio || lastSeenText);

  if (hasTooltip) {
    const tooltip = el("div", "avatar-marker__tooltip");
    tooltip.setAttribute("role", "tooltip");

    if (username) {
      const nameEl = el("strong", "avatar-marker__name", username); // textContent = safe
      tooltip.appendChild(nameEl);
    }
    if (bio) {
      const bioEl = el("p", "avatar-marker__bio", bio); // idem
      tooltip.appendChild(bioEl);
    }
    if (lastSeenText) {
      const seenEl = el("span", "avatar-marker__lastseen", lastSeenText);
      tooltip.appendChild(seenEl);
    }

    // Accessibilité : relier tooltip au wrapper
    const tooltipId = `tooltip-${crypto.randomUUID()}`;
    tooltip.id = tooltipId;
    wrapper.setAttribute("aria-describedby", tooltipId);

    wrapper.appendChild(tooltip);
  }

 
  if (onClick) {
    wrapper.addEventListener("click", onClick);
    wrapper.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    });
  }

  return wrapper;
}