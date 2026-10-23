"use client";

import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { Slide } from "./slide";
import type { SlideData } from "./types";

/** Chop etish (PDF) ko'rinishi: har slayd alohida varaqda. Ochilganda chop etish oynasi chiqadi. */
export function PrintSlides({ title, slides }: { title: string; slides: SlideData[] }) {
  const t = useTranslations("Learn");
  const asked = useRef(false);

  useEffect(() => {
    if (asked.current) return;
    asked.current = true;
    let alive = true;
    void document.fonts.ready.then(() => {
      if (alive) window.setTimeout(() => window.print(), 400);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="slides-print">
      <div className="slides-print__bar">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm opacity-80">{t("printHint")}</p>
        </div>
        <button type="button" className="slides-print__button" onClick={() => window.print()}>
          <Printer aria-hidden className="size-4" />
          {t("printButton")}
        </button>
      </div>
      {slides.map((slide, index) => (
        <div key={index} className="slides-print__page">
          <Slide
            slide={slide}
            index={index}
            label={t("slideOf", { n: index + 1, total: slides.length })}
          />
        </div>
      ))}
    </main>
  );
}
