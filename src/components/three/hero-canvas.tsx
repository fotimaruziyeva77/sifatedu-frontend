"use client";

import dynamic from "next/dynamic";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";

import { useTheme } from "@/components/theme/use-theme";
import { cn } from "@/lib/utils";

import { SKILLS, SKILLS_LOW_TIER, type Track } from "./constellation";
import { HeroPoster } from "./hero-poster";
import type { LabelUpdate, PointerState, SceneTier } from "./hero-scene";

// three.js faqat brauzerda va sahifa yuklangandan keyin yuklanadi (LCP'ga ta'sir qilmaydi).
const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false });

/** Kirish animatsiyasi sessiyada bir marta: qaytgan odam darhol turkumni ko'radi. */
const INTRO_KEY = "sifat:intro-seen";

export type SkillLabel = { id: string; label: string; track: Track };

type NavigatorWithHints = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

/** 3D ko'rsatilmaydigan holatlarda `null`: poster qoladi. */
function detectTier(): SceneTier | null {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const nav = navigator as NavigatorWithHints;
  if (nav.connection?.saveData) return null;

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
  if (!gl) return null;

  const small = window.matchMedia("(max-width: 767px)").matches;
  const weak = (nav.hardwareConcurrency ?? 4) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  return small || weak ? "low" : "high";
}

function introSeen(): boolean {
  try {
    return sessionStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

export function HeroCanvas({ skills, hint }: { skills: SkillLabel[]; hint: string }) {
  const container = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const pointer = useRef<PointerState>({ x: 0, y: 0, inside: false, at: 0 });
  const labels = useRef<(HTMLElement | null)[]>([]);
  const interacted = useRef(false);
  const theme = useTheme();

  const [tier, setTier] = useState<SceneTier | null>(null);
  const [intro, setIntro] = useState(true);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);
  const [showHint, setShowHint] = useState(false);

  // 3D (≈1 MB JS) sahifa bilan raqobatlashmasligi kerak: avval sahifa to'liq yuklanib,
  // brauzer bo'shaydi, shundan keyin sahna ulanadi. Telefonda esa foydalanuvchi sahifa bilan
  // ishlay boshlagach (scroll, teginish) — ketib qolgan tashrif batareya va trafik sarflamaydi.
  // Shu vaqtgacha statik poster ko'rinib turadi.
  useEffect(() => {
    const detected = detectTier();
    if (!detected) return;
    let cancelled = false;
    let idleId = 0;
    const cleanups: (() => void)[] = [];

    const start = () => {
      if (cancelled) return;
      setIntro(!introSeen());
      setTier(detected);
    };
    const whenIdle = () => {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(start, { timeout: 4000 });
      } else {
        idleId = window.setTimeout(start, 500);
      }
    };
    const whenInteracted = (next: () => void) => {
      const events = ["pointerdown", "scroll", "keydown", "touchstart"] as const;
      const once = () => {
        for (const name of events) window.removeEventListener(name, once);
        next();
      };
      for (const name of events) window.addEventListener(name, once, { passive: true });
      cleanups.push(() => {
        for (const name of events) window.removeEventListener(name, once);
      });
    };
    const afterLoad = (next: () => void) => {
      if (document.readyState === "complete") next();
      else {
        window.addEventListener("load", next, { once: true });
        cleanups.push(() => window.removeEventListener("load", next));
      }
    };

    const small = window.matchMedia("(max-width: 767px)").matches;
    afterLoad(() => (small ? whenInteracted(whenIdle) : whenIdle()));

    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      window.clearTimeout(idleId);
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  // Scroll progressi, kursor va ko'rinish (ekrandan chiqsa render to'xtaydi).
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const hero = element.closest("section") ?? element;

    const onScroll = () => {
      const height = hero.offsetHeight || 1;
      progress.current = Math.min(Math.max(window.scrollY / height, 0), 1);
    };
    const onPointer = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      pointer.current = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -(((event.clientY - rect.top) / rect.height) * 2 - 1),
        inside,
        at: performance.now(),
      };
      if (inside && !interacted.current && event.pointerType === "mouse") {
        interacted.current = true;
        // Yozuv bir necha soniya ko'rinib turadi, keyin o'zi yo'qoladi.
        globalThis.setTimeout(() => setShowHint(false), 2400);
      }
    };
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));

    onScroll();
    observer.observe(element);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  const handleReady = useCallback(() => setReady(true), []);
  const handleIntroEnd = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      // Sessiya xotirasi yopiq bo'lsa, kirish animatsiyasi keyingi safar ham ko'rinadi.
    }
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (finePointer && !interacted.current) setShowHint(true);
  }, []);
  // Sahna har kadrda chaqiradi: yorliq tugun ustida turadi, orqadagilari xiraroq.
  const handleLabel = useCallback<LabelUpdate>((index, x, y, opacity, hot) => {
    const element = labels.current[index];
    if (!element) return;
    element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    element.style.opacity = opacity.toFixed(3);
    element.toggleAttribute("data-hot", hot);
  }, []);
  const handleFallback = useCallback(() => {
    setTier(null);
    setReady(false);
  }, []);

  const visibleSkills = skills.slice(0, tier === "low" ? SKILLS_LOW_TIER : SKILLS.length);

  return (
    <div
      ref={container}
      aria-hidden
      className="absolute inset-x-0 top-0 h-[50svh] min-h-80 lg:inset-0 lg:h-auto"
    >
      <HeroPoster className={cn("transition-opacity duration-700", ready && "opacity-0")} />
      {tier && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            ready ? "opacity-100" : "opacity-0",
          )}
        >
          <HeroScene
            tier={tier}
            theme={theme}
            active={active}
            intro={intro}
            progress={progress}
            pointer={pointer}
            onLabel={handleLabel}
            onReady={handleReady}
            onIntroEnd={handleIntroEnd}
            onFallback={handleFallback}
          />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {visibleSkills.map((skill, index) => (
              <div
                key={skill.id}
                ref={(element) => {
                  labels.current[index] = element;
                }}
                className="hero-skill"
                style={{ "--track": `var(--track-${skill.track})` } as CSSProperties}
              >
                <span>{skill.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className={cn("hero-hint", showHint && "is-visible")}>{hint}</p>
    </div>
  );
}
