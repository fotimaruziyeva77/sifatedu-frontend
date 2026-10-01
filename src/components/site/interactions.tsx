"use client";

import { useEffect } from "react";

const REVEAL = "[data-reveal]:not([data-visible])";
const PLAY = "[data-play]";
const MAGNET_PULL = 0.22;
const MAGNET_MAX = 10;

/**
 * Butun sayt uchun bitta client komponent: bo'limlar server komponent bo'lib qoladi,
 * animatsiya esa `data-*` atributlari orqali yoqiladi.
 *   data-reveal     — ekranga kirganda paydo bo'ladi (bir marta)
 *   data-play       — ekrandan chiqqanda ichidagi CSS animatsiyalari to'xtaydi
 *   data-spotlight  — kursor ostida yumshoq yorug'lik (--mx, --my)
 *   data-magnetic   — tugma kursorga biroz tortiladi
 */
export function Interactions() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-visible", "");
          reveal.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    const play = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        entry.target.toggleAttribute("data-playing", entry.isIntersecting);
      }
    });

    const observed = new WeakSet<Element>();
    const scan = () => {
      document.querySelectorAll(REVEAL).forEach((element) => {
        if (observed.has(element)) return;
        observed.add(element);
        reveal.observe(element);
      });
      document.querySelectorAll(PLAY).forEach((element) => {
        if (observed.has(element)) return;
        observed.add(element);
        play.observe(element);
      });
    };

    // Client'da keyin chiziladigan elementlar (test natijasi, sahifalar orasida o'tish).
    let scheduled = 0;
    const mutations = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = requestAnimationFrame(() => {
        scheduled = 0;
        scan();
      });
    });

    scan();
    mutations.observe(document.body, { childList: true, subtree: true });

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let magnet: HTMLElement | null = null;
    let pointerFrame = 0;
    let lastEvent: PointerEvent | null = null;

    const releaseMagnet = () => {
      if (magnet) magnet.style.translate = "";
      magnet = null;
    };

    const onPointerFrame = () => {
      pointerFrame = 0;
      const event = lastEvent;
      if (!event || !(event.target instanceof Element)) return;

      const spot = event.target.closest<HTMLElement>("[data-spotlight]");
      if (spot) {
        const rect = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        spot.style.setProperty("--my", `${event.clientY - rect.top}px`);
      }

      if (!finePointer.matches || reduceMotion.matches) return;
      const next = event.target.closest<HTMLElement>("[data-magnetic]");
      if (next !== magnet) releaseMagnet();
      magnet = next;
      if (!magnet) return;
      const rect = magnet.getBoundingClientRect();
      const dx = (event.clientX - (rect.left + rect.width / 2)) * MAGNET_PULL;
      const dy = (event.clientY - (rect.top + rect.height / 2)) * MAGNET_PULL;
      const clamp = (value: number) => Math.max(-MAGNET_MAX, Math.min(MAGNET_MAX, value));
      magnet.style.translate = `${clamp(dx)}px ${clamp(dy)}px`;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      lastEvent = event;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(onPointerFrame);
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerleave", releaseMagnet);

    return () => {
      reveal.disconnect();
      play.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(scheduled);
      cancelAnimationFrame(pointerFrame);
      document.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", releaseMagnet);
    };
  }, []);

  return null;
}
