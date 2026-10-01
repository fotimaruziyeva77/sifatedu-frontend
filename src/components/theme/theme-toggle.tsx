"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { applyTheme, readTheme, storedTheme, storeTheme, systemTheme, type Theme } from "./theme";
import { useTheme } from "./use-theme";

/** Kun/tun tugmasi: yangi tema tugma turgan joydan doira bo'lib ochiladi. */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("Theme");
  const theme = useTheme();
  const button = useRef<HTMLButtonElement>(null);
  const maskId = useId();

  // Dev rejimida StrictMode <html> klasslarini tozalaydi: saqlangan temani qayta qo'yamiz.
  useLayoutEffect(() => {
    applyTheme(storedTheme() ?? systemTheme());
    document.documentElement.classList.add("js");
  }, []);

  // Foydalanuvchi o'zi tanlamagan bo'lsa, tizim temasi o'zgarishiga ergashadi.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!storedTheme()) applyTheme(media.matches ? "dark" : "light");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    storeTheme(next);

    const element = button.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!element || reduceMotion || typeof document.startViewTransition !== "function") {
      applyTheme(next);
      return;
    }

    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transition = document.startViewTransition(() => applyTheme(next));
    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
          },
          {
            duration: 700,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {
        // O'tish bekor qilinsa ham tema allaqachon qo'yilgan.
      });
  }

  const dark = theme === "dark";
  const label = dark ? t("toLight") : t("toDark");

  return (
    <button
      ref={button}
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "theme-toggle inline-flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent",
        className,
      )}
    >
      {/* Quyosh (kun) → oy (tun): markaz kattalashadi, "soya" doirasi uni o'roqqa aylantiradi. */}
      <svg viewBox="0 0 24 24" aria-hidden className="size-5 overflow-visible">
        <mask id={maskId}>
          <rect x="-4" y="-4" width="32" height="32" fill="white" />
          <circle className="theme-toggle__cut" cx="25" cy="3" r="6.5" fill="black" />
        </mask>
        <circle
          className="theme-toggle__core"
          cx="12"
          cy="12"
          r="5"
          fill="currentColor"
          mask={`url(#${maskId})`}
        />
        <g
          className="theme-toggle__rays"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 1.5v2M12 20.5v2M1.5 12h2M20.5 12h2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M4.6 19.4 6 18M18 6l1.4-1.4" />
        </g>
      </svg>
    </button>
  );
}
