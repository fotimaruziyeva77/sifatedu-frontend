"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { type RefObject, useEffect, useRef } from "react";

/** Tez ochilgan sahifada chiziq ko'rinmasin: o'tish shundan uzoq cho'zilsagina paydo bo'ladi. */
const SHOW_AFTER_MS = 120;
/** O'tish tugamay qolsa (bekor qilindi, tarmoq uzildi) chiziq baribir yo'qoladi. */
const GIVE_UP_MS = 10_000;

type Run = { startedAt: number; giveUp: number };

/** Bosilgan havola boshqa sahifaga (shu saytning ichida) olib boradimi. */
function leavesPage(event: MouseEvent): boolean {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  const anchor = event.target instanceof Element ? event.target.closest("a") : null;
  if (!anchor || anchor.hasAttribute("download")) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  // Faqat #hash o'zgarsa — sahifa o'sha, kutadigan narsa yo'q.
  return url.pathname !== window.location.pathname || url.search !== window.location.search;
}

function start(bar: HTMLElement, run: RefObject<Run | null>) {
  if (run.current) window.clearTimeout(run.current.giveUp);
  bar.getAnimations().forEach((animation) => animation.cancel());
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  bar.animate(
    still
      ? [
          { opacity: 1, transform: "scaleX(1)" },
          { opacity: 1, transform: "scaleX(1)" },
        ]
      : [
          { opacity: 1, transform: "scaleX(0)" },
          { opacity: 1, transform: "scaleX(0.85)" },
        ],
    {
      duration: 8000,
      delay: SHOW_AFTER_MS,
      easing: "cubic-bezier(0.1, 0.7, 0.2, 1)",
      fill: "forwards",
    },
  );
  run.current = {
    startedAt: performance.now(),
    giveUp: window.setTimeout(() => finish(bar, run), GIVE_UP_MS),
  };
}

function finish(bar: HTMLElement, run: RefObject<Run | null>) {
  const current = run.current;
  if (!current) return;
  run.current = null;
  window.clearTimeout(current.giveUp);
  const shown = performance.now() - current.startedAt > SHOW_AFTER_MS;
  // Joriy holatdan davom ettirish uchun animatsiyani to'xtatishdan oldin o'qiymiz.
  const { transform } = getComputedStyle(bar);
  bar.getAnimations().forEach((animation) => animation.cancel());
  if (!shown) return;
  bar.animate(
    [
      { opacity: 1, transform },
      { opacity: 1, transform: "scaleX(1)", offset: 0.4 },
      { opacity: 0, transform: "scaleX(1)" },
    ],
    { duration: 500, easing: "ease-out" },
  );
}

/**
 * Sahifalar orasida o'tishda yuqorida ingichka chiziq. Ommaviy sayt va kirish sahifalarida
 * `loading.tsx` o'rniga ishlatiladi: u javobni oqim (streaming) bilan yubormaydi, shuning uchun
 * 404 va redirect'lar haqiqiy HTTP holati bilan qoladi (SEO uchun muhim).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const bar = useRef<HTMLDivElement>(null);
  const run = useRef<Run | null>(null);

  // Capture bosqichida: Link bosishni o'zi qayta ishlashidan oldin ushlaymiz.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (bar.current && leavesPage(event)) start(bar.current, run);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Manzil o'zgardi — yangi sahifa chizildi.
  useEffect(() => {
    if (bar.current) finish(bar.current, run);
  }, [pathname, search]);

  return <div ref={bar} aria-hidden className="nav-progress" />;
}
