import { getMessages } from "next-intl/server";
import type { Metadata } from "next";
import { ReactNode } from "react";
import "@/styles/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { bebas_neue, montserrat, playdisplay } from "@/fonts/font";
import {ThemeProvider} from "next-themes";
import CursorEffect from "@/animate/cursorEffect";
export const metadata: Metadata = {
  title: {
    default: "Toctoc",
    template: "%s | Toctoc",
  },
  description: "Recherchez parmi des milliers de profils vérifiés de personnel de maison en Côte d'Ivoire. Notre IA vous aide à trouver la perle rare, gratuitement.",
  icons: {
 
    icon: {
      url: "/icons/icon_32x32.png", 
      sizes: "32x32",
      type: "image/png", 
    },

    apple: {
      url: "/icons/icon_180x180.png",
      sizes: "180x180",
      type: "image/png",
    },
  
    other: [
      { url: "/icons/icon_16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon_192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon_512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};


type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function RootLayout({ children, params }: Props) {

  const { locale } = await params;


  const messages = await getMessages({locale});

  return (
    <html lang={locale} dir={locale==='ar' ? 'rtl':'ltr'} suppressHydrationWarning>
      <body className={`${playdisplay.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" enableSystem defaultTheme="system">
          <CursorEffect>
          {children}
          </CursorEffect >
          </ThemeProvider>
          
        </NextIntlClientProvider>
      </body>
    </html>
  );
}