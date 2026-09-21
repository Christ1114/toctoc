

import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getProviderById, getProviderVideos } from "@/app/lib/queries/providers";
import ProviderProfileClient from "./ProviderProfileClient";

export const revalidate = 60;


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const provider = await getProviderById(id);

  if (!provider) {
    return { title: "Prestataire introuvable" };
  }

  const title = provider.name
    ? `${provider.name} — Prestataire`
    : "Profil prestataire";

  const description =
    provider.bio?.slice(0, 160) ??
    "Découvrez ce prestataire de confiance sur notre plateforme.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: provider.image ? [{ url: provider.image }] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: provider.image ? [provider.image] : undefined,
    },
  };
}

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;

  const [provider, videosResult] = await Promise.all([
    getProviderById(id),
    getProviderVideos(id, 0, 20),
  ]);

  if (!provider) notFound();

 
  const t = await getTranslations("ProviderProfile");


  const translations = {
    back: t("back"),
    bookNow: t("bookNow"),
    contact: t("contact"),
    favorite: t("favorite"),
    share: t("share"),
    online: t("online"),
    offline: t("offline"),
    verified: t("verified"),
    unnamed: t("unnamed"),
    memberSince: t("memberSince", {
      year: new Date(provider.createdAt).getFullYear(),
    }),
    perHour: t("perHour"),
    bio: t("bio"),
    details: t("details"),
    providerType: t("providerType"),
    hourlyRate: t("hourlyRate"),
    verificationLevel: t("verificationLevel"),
    region: t("region"),
    noVideos: t("noVideos"),
    noReviews: t("noReviews"),
    noAvailability: t("noAvailability"),
    videoFallbackTitle: t("videoFallbackTitle"),
    tabs: {
      about: t("tabs.about"),
      videos: t("tabs.videos"),
      reviews: t("tabs.reviews"),
      availability: t("tabs.availability"),
    },
    providerTypes: {
      BABYSITTER: t("providerTypes.BABYSITTER"),
      GARDE_PERISCOLAIRE: t("providerTypes.GARDE_PERISCOLAIRE"),
      MENAGE: t("providerTypes.MENAGE"),
      AIDE_PERSONNES_AGEES: t("providerTypes.AIDE_PERSONNES_AGEES"),
      RESIDENTIEL: t("providerTypes.RESIDENTIEL"),
      COURT_TERME: t("providerTypes.COURT_TERME"),
    },
    levels: {
      BASIC: t("levels.BASIC"),
      ADVANCED: t("levels.ADVANCED"),
      PREMIUM: t("levels.PREMIUM"),
    },
  };

  return (
    <ProviderProfileClient
      provider={provider}
      videos={videosResult.videos}
      hasMoreVideos={videosResult.hasMore}
      translations={translations}
    />
  );
}