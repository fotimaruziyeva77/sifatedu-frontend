import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { SkipLink } from "@/components/site/skip-link";
import { UserMenu } from "@/components/site/user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { audienceOf } from "@/features/dashboard/nav";
import { AppShell } from "@/features/dashboard/shell";
import { NotificationBell } from "@/features/notifications/bell";
import { ClientMessages } from "@/i18n/client-messages";
import { getMe, toViewer } from "@/lib/api/me";

import "../(site)/landing.css";
import "./app.css";

export const dynamic = "force-dynamic";

/** Kabinet: faqat kirgan foydalanuvchi uchun. Chap tomonda menyu. */
export default async function AppLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const me = await getMe(locale);
  // Sessiya yo'q yoki eskirgan: kirish sahifasiga. `next` til prefiksisiz beriladi —
  // kirgandan keyin uni next-intl router o'zi qo'shadi.
  if (!me) redirect(`/${locale}/auth/login?next=/dashboard`);

  return (
    <ClientMessages group="app">
      <SkipLink />
      <AppShell
        audience={audienceOf(me.audience)}
        roles={me.roles}
        schedule={me.has_schedule}
        daily={me.in_group}
        counts={{ notifications: me.unread_notifications, reviews: me.pending_reviews }}
        tools={
          <>
            <NotificationBell unread={me.unread_notifications} />
            <ThemeToggle />
            <LocaleSwitcher />
            <UserMenu viewer={toViewer(me)} />
          </>
        }
      >
        {children}
      </AppShell>
    </ClientMessages>
  );
}
