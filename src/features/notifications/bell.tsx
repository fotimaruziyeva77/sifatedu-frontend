import { Bell } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/** Yuqori paneldagi qo'ng'iroqcha: telefonda menyu yopiq bo'lsa ham yangi xabar ko'rinadi. */
export async function NotificationBell({ unread }: { unread: number }) {
  const t = await getTranslations("Notifications");
  const label = unread > 0 ? t("bellUnread", { count: unread }) : t("title");

  return (
    <Link
      href="/dashboard/notifications"
      aria-label={label}
      title={label}
      className="app-bell inline-flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent"
    >
      <Bell aria-hidden className="size-5" />
      {unread > 0 && <span aria-hidden className="app-bell__dot" />}
    </Link>
  );
}
