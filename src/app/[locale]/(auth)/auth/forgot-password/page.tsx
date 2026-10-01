import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthCard } from "@/features/auth/auth-card";
import { ForgotPasswordForm } from "@/features/auth/forgot-form";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/auth/forgot-password">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: t("forgotTitle"), robots: { index: false } };
}

export default async function ForgotPasswordPage({
  params,
}: PageProps<"/[locale]/auth/forgot-password">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <AuthCard title={t("forgotTitle")} subtitle={t("forgotSubtitle")}>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href="/auth/login" className="auth-link">
          {t("loginLink")}
        </Link>
      </p>
    </AuthCard>
  );
}
