import { ArrowRight, Send } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { NotificationSettings } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

/**
 * "Xabarlarni Telegram'da oling": Telegram ulanmagan yoki bot bloklangan bo'lsa ko'rinadi.
 * Ulash sozlamalar sahifasida (bir martalik havola va kutish o'sha yerda).
 */
export async function TelegramPrompt({
  settings,
  className,
}: {
  settings: NotificationSettings;
  className?: string;
}) {
  const { available, connected, blocked } = settings.telegram;
  if (!available || (connected && !blocked)) return null;
  const t = await getTranslations("Notifications");

  return (
    <aside className={cn("notify-prompt", className)} aria-labelledby="telegram-prompt">
      <span aria-hidden className="notify-prompt__icon">
        <Send className="size-5" />
      </span>
      <div className="grid gap-1">
        <p id="telegram-prompt" className="font-medium">
          {t("promptTitle")}
        </p>
        <p className="text-sm text-pretty text-muted-foreground">{t("promptText")}</p>
      </div>
      <Link
        href={{ pathname: "/dashboard/settings", hash: "notifications" }}
        className="notify-prompt__action"
      >
        {t("promptAction")}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </aside>
  );
}
