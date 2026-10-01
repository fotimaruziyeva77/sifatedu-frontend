import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthCard, TermsNote } from "@/features/auth/auth-card";
import { SocialPhoneForm } from "@/features/auth/social-phone-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/auth/phone">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: t("phoneTitle"), robots: { index: false } };
}

/** Google yoki Telegram'dan keyingi oxirgi qadam: telefon raqami. */
export default async function SocialPhonePage({ params }: PageProps<"/[locale]/auth/phone">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <AuthCard title={t("phoneTitle")} subtitle={t("phoneSubtitle")}>
      <SocialPhoneForm />
      <TermsNote />
    </AuthCard>
  );
}
