import { Suspense } from "react";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { NavigationProgress } from "@/components/site/navigation-progress";
import { SkipLink } from "@/components/site/skip-link";
import { ChatLauncher } from "@/features/assistant/chat-launcher";
import { ClientMessages } from "@/i18n/client-messages";
import { getMe, toViewer } from "@/lib/api/me";
import { getSite } from "@/lib/api/site";

/** Ommaviy sahifalar: landing, huquqiy sahifalar, 404 — header va footer bilan. */
export default async function SiteLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  const [site, me] = await Promise.all([getSite(locale), getMe(locale)]);

  return (
    <ClientMessages group="site">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <SkipLink />
      <SiteHeader viewer={me ? toViewer(me) : null} />
      <main id="main">{children}</main>
      <SiteFooter site={site} />
      {/* AI maslahatchi: ish vaqtidan keyin ham mijoz javobsiz qolmaydi. */}
      {site?.settings.assistant_enabled && <ChatLauncher />}
    </ClientMessages>
  );
}
