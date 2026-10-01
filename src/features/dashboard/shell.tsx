"use client";

import { LayoutPanelLeft, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { Link, usePathname } from "@/i18n/navigation";

import { isStaff, navFor, unreadBadge, type Audience } from "./nav";

/**
 * Kabinet ramkasi: chap tomonda menyu, o'ngda kontent.
 *
 * `audience` faqat uslubni almashtiradi — bolalar kabineti (SIFAT Kids) yirikroq va rangli,
 * bo'limlar esa ikkalasida bir xil. `roles` menyuni to'ldiradi: o'qituvchiga "Guruhlarim",
 * xodimlarga boshqaruv paneli havolasi. `counts` — menyudagi sonlar: o'qilmagan xabarlar va
 * tekshirilishi kerak bo'lgan uy vazifalari.
 */
export function AppShell({
  audience,
  roles,
  schedule,
  counts,
  tools,
  children,
}: {
  audience: Audience;
  roles: readonly string[];
  /** Guruh darslari bor — menyuda "Jadval". */
  schedule: boolean;
  counts: { notifications: number; reviews: number };
  tools: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations("Dashboard");
  const tNav = useTranslations("Nav");
  const tNotify = useTranslations("Notifications");
  const numbers: Partial<Record<string, number>> = {
    notifications: counts.notifications,
    reviews: counts.reviews,
  };
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Panel ochiq bo'lganda Esc bilan yopiladi.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="app-shell" data-audience={audience}>
      {open && (
        <button
          type="button"
          className="app-scrim"
          tabIndex={-1}
          aria-label={tNav("close")}
          onClick={() => setOpen(false)}
        />
      )}

      <nav className="app-side" aria-label={t("menu")} data-open={open || undefined}>
        <div className="app-side__top">
          <Link href="/dashboard" aria-label="Sifat Edu" className="rounded-sm">
            <Logo className="h-4" />
          </Link>
          <button
            type="button"
            className="app-side__close"
            onClick={() => setOpen(false)}
            aria-label={tNav("close")}
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>

        <ul className="app-side__list">
          {navFor(roles, { schedule }).map(({ href, icon: Icon, labelKey }) => {
            const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="app-side__link"
                  aria-current={active ? "page" : undefined}
                  // Telefonda bo'limga o'tilganda panel yopiladi.
                  onClick={() => setOpen(false)}
                >
                  <span aria-hidden className="app-side__icon">
                    <Icon className="size-[18px]" />
                  </span>
                  {labelKey === "courses" ? t("myCourses") : tNav(labelKey)}
                  {unreadBadge(numbers[labelKey] ?? 0) && (
                    <span className="app-side__count">
                      <span aria-hidden>{unreadBadge(numbers[labelKey] ?? 0)}</span>
                      <span className="sr-only">
                        {tNotify("unread", { count: numbers[labelKey] ?? 0 })}
                      </span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {isStaff(roles) && (
          // Django admin — Next sahifasi emas, shuning uchun oddiy havola.
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a href="/admin/" className="app-side__link app-side__admin">
            <span aria-hidden className="app-side__icon">
              <LayoutPanelLeft className="size-[18px]" />
            </span>
            {tNav("adminPanel")}
          </a>
        )}
      </nav>

      <div className="app-body">
        <header className="app-bar">
          <button
            type="button"
            className="app-burger"
            onClick={() => setOpen(true)}
            aria-label={tNav("menu")}
          >
            <Menu aria-hidden className="size-5" />
          </button>
          <Link href="/dashboard" aria-label="Sifat Edu" className="app-bar__logo">
            <Logo className="h-4" />
          </Link>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">{tools}</div>
        </header>

        <main id="main" className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
