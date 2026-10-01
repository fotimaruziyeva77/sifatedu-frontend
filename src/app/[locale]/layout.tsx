import type { Metadata, Viewport } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { Interactions } from "@/components/site/interactions";
import { THEME_COLORS, THEME_SCRIPT } from "@/components/theme/theme";
import { Toaster } from "@/components/ui/sonner";
import { fontVariables } from "@/fonts";
import { localeAlternates } from "@/i18n/alternates";
import { ClientMessages } from "@/i18n/client-messages";
import { routing } from "@/i18n/routing";

import "../globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
  colorScheme: "light dark",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(APP_URL),
    title: { default: t("title"), template: "%s — Sifat Edu" },
    description: t("description"),
    alternates: localeAlternates(locale),
    // og:url berilmaydi: ichki sahifalarga meros bo'lib, bosh sahifani ko'rsatib qo'yardi.
    openGraph: {
      type: "website",
      siteName: "Sifat Edu",
      title: t("title"),
      description: t("description"),
      locale,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  // CSP nonce'i `proxy.ts` da yaratiladi. Next.js o'z skriptlariga uni o'zi qo'yadi,
  // bizning inline skriptga esa qo'lda beriladi.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    // Tema klassini <head>'dagi script qo'yadi, shuning uchun <html> atributlari farq qiladi.
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <ClientMessages group="root">
          {/* Header, footer va <main> route group layout'larida: (site), (auth), (app). */}
          {children}
          <Toaster position="bottom-center" />
          <Interactions />
        </ClientMessages>
      </body>
    </html>
  );
}
