import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CatalogView, catalogQuery } from "@/features/catalog/catalog-view";
import { SectionHeading } from "@/features/landing/section";
import { localeAlternates } from "@/i18n/alternates";

import "./catalog.css";

// Kurslar admin paneldan o'zgaradi va filtrlar URL'ga bog'liq.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/courses">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Catalog" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: localeAlternates(locale, "/courses"),
  };
}

export default async function CoursesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/courses">) {
  const [{ locale }, search] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations("Catalog");

  return (
    <section className="pt-28 pb-24 sm:pt-32 sm:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          as="h1"
          id="catalog-title"
          eyebrow={t("eyebrow")}
          title={t("heading")}
          subtitle={t("subtitle")}
        />
        <CatalogView locale={locale} query={catalogQuery(search)} base="/courses" />
      </div>
    </section>
  );
}
