type AvatarMarkerOptions = {
  imageUrl?: string | null;
  fallbackLabel: string;
  color?: string; 
};

export function createAvatarMarkerElement({
  imageUrl,
  fallbackLabel,
  color = "#432dd7",
}: AvatarMarkerOptions): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = "avatar-marker";

  wrapper.innerHTML = `
    <div class="avatar-marker__bubble" style="border-color: ${color};">
      ${
        imageUrl
          ? `<img src="${imageUrl}" alt="" class="avatar-marker__img" />`
          : `<span class="avatar-marker__fallback" style="background:${color};">${fallbackLabel
              .charAt(0)
              .toUpperCase()}</span>`
      }
    </div>
    <div class="avatar-marker__pointer" style="border-top-color: ${color};"></div>
    <div class="avatar-marker__shadow"></div>
  `;

  return wrapper;
}