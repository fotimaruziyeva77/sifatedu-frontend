import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { AuthCard } from "@/features/auth/auth-card";
import { TelegramCallback } from "@/features/auth/telegram-callback";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/auth/telegram">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: t("telegramTitle"), robots: { index: false } };
}

/** Telegram widget'i kirgach shu sahifaga yo'naltiradi (`data-auth-url`). */
export default async function TelegramReturnPage({ params }: PageProps<"/[locale]/auth/telegram">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <AuthCard title={t("telegramTitle")}>
      <Suspense fallback={null}>
        <TelegramCallback />
      </Suspense>
    </AuthCard>
  );
}
