"use client";

import {
  GlobeIcon,
  InstagramLogoIcon,
  FacebookLogoIcon,
  TiktokLogoIcon,
  LinkedinLogoIcon,
  YoutubeLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { isSafeUrl } from "@/app/lib/security/url-validation";

type SocialProvider = {
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  twitter?: string | null;
};

type LinkDef = {
  key: string;
  href: string;
  icon: typeof GlobeIcon;
  label: string;
};

export default function SocialLinks({ provider }: { provider: SocialProvider }) {
  const candidates: {
    key: string;
    href: string | null | undefined;
    icon: typeof GlobeIcon;
    label: string;
  }[] = [
    { key: "website",   href: provider.website,   icon: GlobeIcon,         label: "Site web" },
    { key: "instagram", href: provider.instagram, icon: InstagramLogoIcon, label: "Instagram" },
    { key: "facebook",  href: provider.facebook,  icon: FacebookLogoIcon,  label: "Facebook" },
    { key: "tiktok",    href: provider.tiktok,    icon: TiktokLogoIcon,    label: "TikTok" },
    { key: "linkedin",  href: provider.linkedin,  icon: LinkedinLogoIcon,  label: "LinkedIn" },
    { key: "youtube",   href: provider.youtube,   icon: YoutubeLogoIcon,   label: "YouTube" },
    { key: "twitter",   href: provider.twitter,   icon: XLogoIcon,         label: "X" },
  ];

  const links: LinkDef[] = candidates
    .filter((l): l is LinkDef => isSafeUrl(l.href))
    .map((l) => ({ key: l.key, href: l.href, icon: l.icon, label: l.label }));

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
      {links.map(({ key, href, icon: Icon, label }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          aria-label={label}
          title={label}
          className="h-8 w-8 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-[#432dd7]/10 hover:text-[#432dd7] dark:hover:bg-[#432dd7]/20 flex items-center justify-center text-gray-700 dark:text-white/70 transition-colors"
        >
          <Icon size={15} />
        </a>
      ))}
    </div>
  );
}