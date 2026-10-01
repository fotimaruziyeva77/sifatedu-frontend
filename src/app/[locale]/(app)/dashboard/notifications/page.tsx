import { BellOff } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { NotificationList } from "@/features/notifications/notification-list";
import { TelegramPrompt } from "@/features/notifications/telegram-prompt";
import { getNotifications, getNotificationSettings } from "@/lib/api/notifications";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/notifications">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Notifications" });
  return { title: t("title"), robots: { index: false } };
}

/** Kabinetdagi xabarlar: admin yuborganlari va avtomatik (to'lov, kurs, muddat). */
export default async function NotificationsPage({
  params,
}: PageProps<"/[locale]/dashboard/notifications">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, format, items, settings] = await Promise.all([
    getTranslations("Notifications"),
    getFormatter(),
    getNotifications(locale),
    getNotificationSettings(locale),
  ]);
  const notes = items.map((item) => ({
    ...item,
    when: format.dateTime(new Date(item.created_at), {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  return (
    <>
      <header>
        <h1 className="app-title">{t("title")}</h1>
        <p className="mt-3 max-w-xl text-pretty text-muted-foreground">{t("intro")}</p>
      </header>

      {settings && <TelegramPrompt settings={settings} className="mt-8" />}

      {notes.length === 0 ? (
        <div className="app-empty mt-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-caret">
            <BellOff aria-hidden className="size-6" />
          </span>
          <p className="max-w-lg text-pretty text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="mt-8">
          <NotificationList items={notes} />
        </div>
      )}
    </>
  );
}
