import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PasswordForm } from "@/features/auth/password-form";
import { ProfileForm } from "@/features/auth/profile-form";
import { NotificationSettingsCard } from "@/features/notifications/settings-card";
import { RatingVisibility } from "@/features/rewards/rating-visibility";
import { getMe } from "@/lib/api/me";
import { getNotificationSettings } from "@/lib/api/notifications";
import { getRewards } from "@/lib/api/rewards";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/settings">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("settingsTitle"), robots: { index: false } };
}

export default async function SettingsPage({ params }: PageProps<"/[locale]/dashboard/settings">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tNotify, me, notifications, rewards] = await Promise.all([
    getTranslations("Dashboard"),
    getTranslations("Notifications"),
    getMe(locale),
    getNotificationSettings(locale),
    getRewards(locale),
  ]);
  // Layout kirishni tekshiradi; bu yerga faqat sessiya bilan kelinadi.
  if (!me) notFound();

  return (
    <>
      <header>
        <h1 className="app-title">{t("settingsTitle")}</h1>
        <p className="mt-3 max-w-xl text-pretty text-muted-foreground">{t("settingsSubtitle")}</p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="profile" className="app-card">
          <h2 id="profile" className="app-section-title mb-6">
            {t("profile")}
          </h2>
          <ProfileForm me={me} />
        </section>

        <section aria-labelledby="security" className="app-card h-fit">
          <h2 id="security" className="app-section-title mb-6">
            {t("security")}
          </h2>
          <PasswordForm />
        </section>

        {notifications && (
          // `#notifications` — Telegram eslatmasidagi havola shu yerga olib keladi.
          <section id="notifications" aria-labelledby="notifications-title" className="app-card">
            <h2 id="notifications-title" className="app-section-title mb-6">
              {tNotify("settingsTitle")}
            </h2>
            <NotificationSettingsCard initial={notifications} />
          </section>
        )}

        {rewards && <RatingVisibility hidden={rewards.hidden} />}
      </div>
    </>
  );
}
