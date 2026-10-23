"use client";

import { ChevronLeft, ChevronRight, FileDown, Maximize, Minimize } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";

import { Link } from "@/i18n/navigation";

import { SLIDE_H, SLIDE_W, Slide } from "./slide";
import type { SlideData } from "./types";

const BAR_H = 64; // to'liq ekranda pastdagi panel
const SWIPE = 60;

/**
 * Dars slaydlari: ←/→ (yoki surish) bilan varaqlash, F — to'liq ekran (proyektor uchun),
 * «PDF» — chop etish sahifasi. Slayd 1280×720 da chiziladi va maydonga moslab o'lchanadi.
 */
export function SlidesPlayer({ slides, printHref }: { slides: SlideData[]; printHref: string }) {
  const t = useTranslations("Learn");
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(0);
  const [full, setFull] = useState(false);
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const total = slides.length;

  const go = useCallback(
    (delta: number) => setIndex((current) => Math.min(total - 1, Math.max(0, current + delta))),
    [total],
  );

  const toggleFull = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.current?.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () => {
      const isFull = document.fullscreenElement === root.current;
      setFull(isFull);
      setScale(
        isFull
          ? Math.min(window.innerWidth / SLIDE_W, (window.innerHeight - BAR_H) / SLIDE_H)
          : element.clientWidth / SLIDE_W,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    document.addEventListener("fullscreenchange", measure);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      document.removeEventListener("fullscreenchange", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const owner = root.current;
      if (!owner) return;
      const inside = owner.contains(document.activeElement) || document.fullscreenElement === owner;
      if (!inside || event.altKey || event.ctrlKey || event.metaKey) return;
      const onControl = (event.target as HTMLElement | null)?.closest("button, a");
      if (["ArrowRight", "PageDown"].includes(event.key) || (event.key === " " && !onControl)) {
        event.preventDefault();
        go(1);
      } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        go(-1);
      } else if (event.key === "Home") {
        setIndex(0);
      } else if (event.key === "End") {
        setIndex(total - 1);
      } else if (event.key.toLowerCase() === "f") {
        toggleFull();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, toggleFull, total]);

  const down = (event: PointerEvent) => {
    pointer.current = event.clientX;
  };
  const up = (event: PointerEvent) => {
    if (pointer.current === null) return;
    const dx = event.clientX - pointer.current;
    pointer.current = null;
    if (Math.abs(dx) > SWIPE) go(dx < 0 ? 1 : -1);
  };

  const size = full
    ? { width: SLIDE_W * scale, height: SLIDE_H * scale }
    : { height: SLIDE_H * scale };

  return (
    <section
      ref={root}
      className={full ? "slides slides--full" : "slides"}
      aria-label={t("slides")}
      tabIndex={-1}
    >
      <div
        ref={frame}
        className="slides__frame"
        style={scale ? size : undefined}
        onPointerDown={down}
        onPointerUp={up}
      >
        {scale > 0 && (
          <div className="slides__stage" style={{ transform: `scale(${scale})` }}>
            <Slide
              slide={slides[index]}
              index={index}
              label={t("slideOf", { n: index + 1, total })}
            />
          </div>
        )}
      </div>
      <div className="slides__bar">
        <button
          type="button"
          className="slides__btn"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label={t("slidePrev")}
        >
          <ChevronLeft aria-hidden className="size-5" />
        </button>
        <span className="slides__count" aria-live="polite">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          className="slides__btn"
          onClick={() => go(1)}
          disabled={index === total - 1}
          aria-label={t("slideNext")}
        >
          <ChevronRight aria-hidden className="size-5" />
        </button>
        <span className="slides__hint">{t("slidesKeys")}</span>
        <Link href={printHref} target="_blank" className="slides__tool">
          <FileDown aria-hidden className="size-4" />
          PDF
        </Link>
        <button
          type="button"
          className="slides__btn"
          onClick={toggleFull}
          aria-label={full ? t("exitFullscreen") : t("fullscreen")}
        >
          {full ? (
            <Minimize aria-hidden className="size-5" />
          ) : (
            <Maximize aria-hidden className="size-5" />
          )}
        </button>
      </div>
    </section>
  );
}
