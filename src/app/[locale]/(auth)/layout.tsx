import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { NavigationProgress } from "@/components/site/navigation-progress";
import { NetworkField } from "@/components/site/network-field";
import { SkipLink } from "@/components/site/skip-link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ClientMessages } from "@/i18n/client-messages";
import { Link } from "@/i18n/navigation";

import "../(site)/landing.css";
import "./auth.css";

/** Kirish sahifalari: diqqatni formaga qaratadi — menyu yo'q, faqat logo va orqaga havola. */
export default async function AuthLayout({ children }: LayoutProps<"/[locale]">) {
  const t = await getTranslations("Auth");

  return (
    <ClientMessages group="auth">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <SkipLink />
      <div className="relative isolate flex min-h-svh flex-col overflow-hidden">
        <NetworkField className="-z-10 opacity-70" density={0.8} />

        <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <Link href="/" aria-label="Sifat Edu" className="rounded-sm">
            <Logo className="h-4 sm:h-[18px]" />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <LocaleSwitcher />
            <Link href="/" className="auth-back">
              <ArrowLeft aria-hidden className="size-4" />
              <span className="hidden sm:inline">{t("backHome")}</span>
            </Link>
          </div>
        </header>

        <main id="main" className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
    </ClientMessages>
  );
}
