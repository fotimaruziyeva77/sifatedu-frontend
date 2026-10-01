import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CatalogView, catalogQuery } from "@/features/catalog/catalog-view";
import { Emphasis } from "@/features/landing/emphasis";

import "../../../(site)/courses/catalog.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/catalog">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Catalog" });
  return { title: t("title"), robots: { index: false } };
}

/** Barcha kurslar — kabinet ichida: menyu joyida qoladi. */
export default async function DashboardCatalogPage({
  params,
  searchParams,
}: PageProps<"/[locale]/dashboard/catalog">) {
  const [{ locale }, search] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations("Catalog");

  return (
    <>
      <header>
        <h1 className="app-title">
          <Emphasis text={t("heading")} />
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{t("subtitle")}</p>
      </header>
      <div className="mt-8">
        <CatalogView locale={locale} query={catalogQuery(search)} base="/dashboard/catalog" />
      </div>
    </>
  );
}
