import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { AuthCard, AuthDivider, TermsNote } from "@/features/auth/auth-card";
import { RegisterForm } from "@/features/auth/register-form";
import { SocialSignIn } from "@/features/auth/social-sign-in";
import { getMe } from "@/lib/api/me";
import { getSocialProviders } from "@/lib/api/social";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/auth/register">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: t("registerTitle"), robots: { index: false } };
}

export default async function RegisterPage({ params }: PageProps<"/[locale]/auth/register">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, me, providers] = await Promise.all([
    getTranslations("Auth"),
    getMe(locale),
    getSocialProviders(),
  ]);
  if (me) redirect(`/${locale}/dashboard`);
  const hasSocial = Boolean(providers.google_client_id || providers.telegram_bot);

  return (
    <AuthCard title={t("registerTitle")} subtitle={t("registerSubtitle")}>
      {hasSocial && (
        <>
          <SocialSignIn providers={providers} />
          <AuthDivider label={t("or")} />
        </>
      )}
      <RegisterForm />
      <TermsNote />
    </AuthCard>
  );
}
