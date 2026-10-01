"use client";

import { ArrowUpRight, LogIn, MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import type { ViewerSummary } from "@/lib/api/me";
import { cn } from "@/lib/utils";

import { LocaleSwitcher } from "./locale-switcher";
import { CONTACT_SECTION, NAV_SECTIONS, type NavSection } from "./sections";
import { useActiveSection } from "./use-active-section";
import { useLogout, UserMenu } from "./user-menu";

export function SiteHeader({ viewer }: { viewer: ViewerSummary | null }) {
  const t = useTranslations("Nav");
  const active = useActiveSection(NAV_SECTIONS);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b border-transparent transition-[background-color,border-color] duration-300",
        scrolled && "glass border-border",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:gap-8">
        <Link href="/" aria-label={t("home")} className="shrink-0 rounded-sm">
          <Logo className="h-4 sm:h-[18px]" />
        </Link>

        <nav aria-label={t("main")} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_SECTIONS.map((id) => (
              <li key={id}>
                <SectionLink id={id} active={active === id}>
                  {t(id)}
                </SectionLink>
              </li>
            ))}
            <li>
              <Link href="/courses" className="nav-link">
                {t("catalog")}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
          {viewer ? (
            <UserMenu viewer={viewer} />
          ) : (
            <Button
              asChild
              variant="ghost"
              className="hidden h-10 gap-1.5 rounded-full px-4 md:inline-flex"
            >
              <Link href="/auth/login">
                <LogIn aria-hidden />
                {t("login")}
              </Link>
            </Button>
          )}
          <Button
            asChild
            data-magnetic
            className="hidden h-10 gap-1.5 rounded-full px-5 sm:inline-flex"
          >
            <Link href={{ pathname: "/", hash: CONTACT_SECTION }}>
              {t("cta")}
              <ArrowUpRight aria-hidden />
            </Link>
          </Button>
          <MobileMenu active={active} viewer={viewer} />
        </div>
      </div>
    </header>
  );
}

function SectionLink({
  id,
  active,
  children,
  onNavigate,
}: {
  id: NavSection;
  active: boolean;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={{ pathname: "/", hash: id }}
      aria-current={active ? "location" : undefined}
      onClick={onNavigate}
      className="group relative flex items-center rounded-full py-2 pr-3.5 pl-5 text-sm text-muted-foreground transition-colors hover:text-foreground aria-[current=location]:text-foreground"
    >
      {/* Joriy bo'lim — tarmoqdagi "yongan" tugun. */}
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 left-2 size-1.5 -translate-y-1/2 rounded-full bg-caret transition-[opacity,scale] duration-300",
          active
            ? "scale-100 opacity-100"
            : "scale-0 opacity-0 group-hover:scale-75 group-hover:opacity-50",
        )}
      />
      {children}
    </Link>
  );
}

function MobileMenu({ active, viewer }: { active: string | null; viewer: ViewerSummary | null }) {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);
  const { logout, pending } = useLogout();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("menu")}>
          <MenuIcon aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" closeLabel={t("close")}>
        <SheetHeader>
          <SheetTitle>
            <Logo className="h-4" />
          </SheetTitle>
          <SheetDescription className="sr-only">{t("main")}</SheetDescription>
        </SheetHeader>
        <nav aria-label={t("main")} className="px-4">
          <ul className="flex flex-col gap-1">
            {NAV_SECTIONS.map((id) => (
              <li key={id}>
                <SectionLink id={id} active={active === id} onNavigate={() => setOpen(false)}>
                  <span className="text-lg">{t(id)}</span>
                </SectionLink>
              </li>
            ))}
            <li>
              <SheetClose asChild>
                <Link href="/courses" className="nav-link block py-2 pl-5 text-lg">
                  {t("catalog")}
                </Link>
              </SheetClose>
            </li>
          </ul>
        </nav>
        <div className="mt-auto grid gap-2 p-4">
          {viewer ? (
            <>
              <SheetClose asChild>
                <Button asChild variant="outline" className="h-12 w-full rounded-full text-base">
                  <Link href="/dashboard">{t("dashboard")}</Link>
                </Button>
              </SheetClose>
              <Button
                variant="ghost"
                disabled={pending}
                onClick={logout}
                className="h-11 w-full rounded-full"
              >
                {t("logout")}
              </Button>
            </>
          ) : (
            <SheetClose asChild>
              <Button asChild variant="outline" className="h-12 w-full rounded-full text-base">
                <Link href="/auth/login">{t("login")}</Link>
              </Button>
            </SheetClose>
          )}
          <SheetClose asChild>
            <Button asChild className="h-12 w-full rounded-full text-base">
              <Link href={{ pathname: "/", hash: CONTACT_SECTION }}>{t("cta")}</Link>
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
