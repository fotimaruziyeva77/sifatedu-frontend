import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { localeAlternates } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import { getLegalPage } from "@/lib/api/site";

export type LegalSlug = "offer" | "privacy" | "refund-policy";

const DATE_LOCALES: Record<string, string> = {
  uz: "uz-UZ",
  ru: "ru-RU",
  en: "en-GB",
};

export async function legalMetadata(
  slug: LegalSlug,
  params: Promise<{ locale: string }>,
): Promise<Metadata> {
  const { locale } = await params;
  const result = await getLegalPage(slug, locale);
  return result.status === "ok"
    ? {
        title: result.page.title,
        alternates: localeAlternates(locale, `/${slug}`),
      }
    : {};
}

export async function LegalPageView({
  slug,
  params,
}: {
  slug: LegalSlug;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, result] = await Promise.all([getTranslations("Legal"), getLegalPage(slug, locale)]);

  if (result.status === "not-found") notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 pt-32 pb-24 sm:px-6">
      {result.status === "ok" ? (
        <>
          <h1 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-light tracking-tight">
            {result.page.title}
          </h1>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            {t("version", { version: result.page.version })} ·{" "}
            {t("updated", {
              date: new Intl.DateTimeFormat(DATE_LOCALES[locale] ?? "uz-UZ", {
                dateStyle: "long",
              }).format(new Date(result.page.updated_at)),
            })}
          </p>
          {/* Matn backend'da saqlashda tozalanadi (nh3, ruxsat etilgan teglar ro'yxati). */}
          <div
            className="legal-content mt-10"
            dangerouslySetInnerHTML={{ __html: result.page.body }}
          />
        </>
      ) : (
        <p role="alert" className="text-muted-foreground">
          {t("unavailable")}
        </p>
      )}
      <Link href="/" className="mt-16 inline-block text-sm underline-offset-4 hover:underline">
        {t("back")}
      </Link>
    </article>
  );
}
