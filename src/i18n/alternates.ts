import { getTranslations } from "next-intl/server";

import { routing } from "./routing";

/**
 * Sahifaning har bir tildagi manzili (hreflang) va x-default (asosiy til).
 * `path` — til prefiksidan keyingi qism: "" (bosh sahifa) yoki "/offer".
 */
export function languageAlternates(path: string, base = ""): Record<string, string> {
  return {
    ...Object.fromEntries(routing.locales.map((code) => [code, `${base}/${code}${path}`])),
    "x-default": `${base}/${routing.defaultLocale}${path}`,
  };
}

/** Next.js `metadata.alternates`: canonical + barcha tillar. */
/** Topilmagan sahifaning `<title>`'i (generateMetadata ichida). */
export async function notFoundMetadata(locale: string) {
  const t = await getTranslations({ locale, namespace: "NotFound" });
  return { title: t("title"), robots: { index: false } };
}

export function localeAlternates(locale: string, path = "") {
  return {
    canonical: `/${locale}${path}`,
    languages: languageAlternates(path),
  };
}
