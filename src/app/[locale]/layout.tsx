import type { Metadata, Viewport } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { Interactions } from "@/components/site/interactions";
import { THEME_COLORS, THEME_SCRIPT } from "@/components/theme/theme";
import { Toaster } from "@/components/ui/sonner";
import { BrandProvider } from "@/features/center/brand";
import { CenterBlocked } from "@/features/center/center-blocked";
import { CenterMissing } from "@/features/center/center-missing";
import { CenterOffline } from "@/features/center/center-offline";
import { fontVariables } from "@/fonts";
import { localeAlternates } from "@/i18n/alternates";
import { ClientMessages } from "@/i18n/client-messages";
import { routing } from "@/i18n/routing";
import { getCenter, unavailable } from "@/lib/api/center";
import { getSite } from "@/lib/api/site";
import { brandCss } from "@/lib/brand-color";
import { siteOrigin } from "@/lib/site-origin";

import "../globals.css";

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
  const [t, center, origin] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata" }),
    getCenter(),
    siteOrigin(),
  ]);
  const state = unavailable(center);
  if (state) {
    const tCenter = await getTranslations({ locale, namespace: "Center" });
    return {
      title: tCenter(state === "offline" ? "offlineTitle" : "missingTitle"),
      robots: { index: false },
      // Brend noma'lum: birinchi markazning `/favicon.ico` belgisi so'ralmasin.
      icons: { icon: "data:," },
    };
  }
  const site = center.flagship ? null : await getSite(locale);
  const title = center.flagship ? t("title") : center.name;
  const description = center.flagship ? t("description") : (site?.settings.hero_subtitle ?? "");

  return {
    metadataBase: new URL(origin),
    title: { default: title, template: `%s — ${center.name}` },
    description,
    alternates: localeAlternates(locale),
    // Boshqa markazda `/favicon.ico` (birinchi markaz belgisi) so'ralmasin.
    icons: center.flagship ? undefined : { icon: center.logo || "data:," },
    // og:url berilmaydi: ichki sahifalarga meros bo'lib, bosh sahifani ko'rsatib qo'yardi.
    openGraph: {
      type: "website",
      siteName: center.name,
      title,
      description,
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
  const center = await getCenter();
  const colors = brandCss(center.color);
  const brand = {
    name: center.name,
    logo: center.logo,
    logoDark: center.logo_dark,
    flagship: center.flagship,
    legal: center.legal_pages,
  };

  const state = unavailable(center);
  let page = children;
  if (state === "offline") {
    page = <CenterOffline />;
  } else if (state === "missing") {
    page = <CenterMissing />;
  } else if (center.state === "blocked") {
    page = <CenterBlocked phone={center.support_phone} telegram={center.support_telegram} />;
  }

  return (
    // Tema klassini <head>'dagi script qo'yadi, shuning uchun <html> atributlari farq qiladi.
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* `brandCss` faqat `#rrggbb` qiymatdan yig'iladi. */}
        {colors && <style dangerouslySetInnerHTML={{ __html: colors }} />}
      </head>
      <body>
        <BrandProvider brand={brand}>
          <ClientMessages group="root">
            {/* Header, footer va <main> route group layout'larida: (site), (auth), (app). */}
            {page}
            <Toaster position="bottom-center" />
            <Interactions />
          </ClientMessages>
        </BrandProvider>
      </body>
    </html>
  );
}
