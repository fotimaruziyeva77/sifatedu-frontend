"use client";

import { useEffect, useRef } from "react";

/**
 * Yo'l chizig'i scroll bilan to'ladi (`--progress`), chiziq yetib kelgan qadam "yonadi"
 * (`data-active`). JS bo'lmasa CSS'da to'liq chizilgan holat ko'rinadi.
 */
export function PathTrack({ children }: { children: React.ReactNode }) {
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const element = list.current;
    if (!element) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const steps = Array.from(element.querySelectorAll<HTMLElement>("[data-step]"));

    let frame = 0;
    const update = () => {
      frame = 0;
      const nodes = steps
        .map((step) => step.querySelector<HTMLElement>("[data-node]"))
        .filter((node): node is HTMLElement => node !== null);
      if (nodes.length === 0) return;
      const rect = element.getBoundingClientRect();
      const centers = nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return box.top + box.height / 2;
      });
      // Chiziq birinchi va oxirgi tugun markazlari orasida.
      const lineTop = centers[0] - rect.top;
      const lineBottom = rect.bottom - centers[centers.length - 1];
      const length = Math.max(rect.height - lineTop - lineBottom, 1);
      element.style.setProperty("--line-top", `${lineTop.toFixed(1)}px`);
      element.style.setProperty("--line-bottom", `${lineBottom.toFixed(1)}px`);

      const anchor = window.innerHeight * 0.6;
      const progress = reduceMotion
        ? 1
        : Math.min(Math.max((anchor - (rect.top + lineTop)) / length, 0), 1);
      element.style.setProperty("--progress", progress.toFixed(4));
      const reached = rect.top + lineTop + progress * length;
      steps.forEach((step, index) => {
        step.toggleAttribute("data-active", centers[index] <= reached + 1);
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <ol ref={list} className="path">
      {children}
    </ol>
  );
}
