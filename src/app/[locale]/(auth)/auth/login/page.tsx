import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { AuthCard, AuthDivider } from "@/features/auth/auth-card";
import { LoginForm } from "@/features/auth/login-form";
import { SocialSignIn } from "@/features/auth/social-sign-in";
import { Link } from "@/i18n/navigation";
import { getMe } from "@/lib/api/me";
import { getSocialProviders } from "@/lib/api/social";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/auth/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: t("loginTitle"), robots: { index: false } };
}

export default async function LoginPage({ params }: PageProps<"/[locale]/auth/login">) {
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
    <AuthCard title={t("loginTitle")} subtitle={t("loginSubtitle")}>
      {hasSocial && (
        <>
          <SocialSignIn providers={providers} />
          <AuthDivider label={t("or")} />
        </>
      )}
      <LoginForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/auth/register" className="auth-link">
          {t("registerLink")}
        </Link>
      </p>
    </AuthCard>
  );
}
