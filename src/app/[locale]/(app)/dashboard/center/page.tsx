import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { BrandForm } from "@/features/center/settings/brand-form";
import { SetupChecklist } from "@/features/center/settings/checklist";
import { ClickCard } from "@/features/center/settings/click-card";
import { EskizCard } from "@/features/center/settings/eskiz-card";
import { TelegramCard } from "@/features/center/settings/telegram-card";
import { getCenterSetup } from "@/lib/api/center-setup";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/center">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CenterSettings" });
  return { title: t("title"), robots: { index: false } };
}

/** Markaz egasi: birinchi sozlash va keyingi o'zgartirishlar shu sahifada. */
export default async function CenterSettingsPage({
  params,
}: PageProps<"/[locale]/dashboard/center">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, setup] = await Promise.all([getTranslations("CenterSettings"), getCenterSetup(locale)]);
  if (!setup) notFound();

  return (
    <>
      <header>
        <h1 className="app-title">{t("title")}</h1>
        <p className="mt-3 max-w-xl text-pretty text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="center-todo" className="app-card">
          <h2 id="center-todo" className="app-section-title mb-6">
            {t("todoTitle")}
          </h2>
          <SetupChecklist setup={setup} />
          <p className="mt-6 text-sm text-muted-foreground">
            {t.rich("siteTexts", {
              link: (chunks) => (
                <a href={setup.admin.site} className="underline underline-offset-4">
                  {chunks}
                </a>
              ),
            })}
          </p>
        </section>

        <section aria-labelledby="center-brand" className="app-card">
          <h2 id="center-brand" className="app-section-title mb-6">
            {t("brandTitle")}
          </h2>
          <BrandForm brand={setup} />
        </section>

        {setup.telegram.available && (
          <section aria-labelledby="center-telegram" className="app-card h-fit">
            <h2 id="center-telegram" className="app-section-title mb-6">
              {t("telegramTitle")}
            </h2>
            <TelegramCard telegram={setup.telegram} domain={setup.address} />
          </section>
        )}

        {setup.click.available && (
          <section aria-labelledby="center-click" className="app-card h-fit">
            <h2 id="center-click" className="app-section-title mb-6">
              {t("clickTitle")}
            </h2>
            <ClickCard click={setup.click} />
          </section>
        )}

        {setup.eskiz.available && (
          <section aria-labelledby="center-eskiz" className="app-card h-fit">
            <h2 id="center-eskiz" className="app-section-title mb-6">
              {t("eskizTitle")}
            </h2>
            <EskizCard eskiz={setup.eskiz} />
          </section>
        )}
      </div>
    </>
  );
}
