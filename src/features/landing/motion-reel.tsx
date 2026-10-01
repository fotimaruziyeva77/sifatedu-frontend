"use client";

import { CodeXml, Pause, Play, PlayCircle, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { createElement, useEffect, useRef, useState } from "react";

import { CARET, LETTER_PATHS, LOGO_VIEWBOX } from "@/components/brand/logo-paths";
import { cn } from "@/lib/utils";

const SCENES = 5;
const LETTERS_D = Object.values(LETTER_PATHS).join(" ");

/**
 * Promo video bo'lmaganda: kod bilan yasalgan qisqa rolik — kimmiz va nima beramiz.
 * Har sahna CSS animatsiyasi; progress chizig'i tugaganda keyingi sahna. Ekrandan chiqsa yoki
 * foydalanuvchi to'xtatsa, pauza. Harakat kamaytirilgan bo'lsa, sahnalar faqat qo'lda almashadi.
 */
export function MotionReel() {
  const t = useTranslations("Reel");
  const root = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.35,
    });
    if (root.current) observer.observe(root.current);
    return () => {
      media.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, []);

  const playing = inView && !paused && !reduceMotion;
  const texts = [t("s1"), t("s2"), `${t("s3")} · ${t("s3b")} · ${t("s3c")}`, t("s4"), t("s5")];

  return (
    <div ref={root} role="group" aria-label={t("label")} className="reel">
      <ol className="sr-only">
        {texts.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ol>

      <div aria-hidden key={scene} className="reel__stage" data-scene={scene}>
        {scene === 0 && <SceneHello text={t("s1")} />}
        {scene === 1 && <SceneSimple text={t("s2")} />}
        {scene === 2 && <SceneOffer items={[t("s3"), t("s3b"), t("s3c")]} />}
        {scene === 3 && <SceneLanguages text={t("s4")} />}
        {scene === 4 && <SceneCode text={t("s5")} />}
      </div>

      <div className="reel__bar">
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-label={paused || reduceMotion ? t("play") : t("pause")}
          aria-pressed={paused}
          disabled={reduceMotion}
          className="reel__toggle"
        >
          {paused || reduceMotion ? (
            <Play aria-hidden className="size-4 fill-current" />
          ) : (
            <Pause aria-hidden className="size-4 fill-current" />
          )}
        </button>
        <ol className="reel__segments">
          {Array.from({ length: SCENES }, (_, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => setScene(index)}
                aria-label={t("scene", { current: index + 1, total: SCENES })}
                aria-current={index === scene ? "step" : undefined}
                className="reel__segment"
              >
                <span
                  className={cn(
                    "reel__fill",
                    index < scene && "is-done",
                    index === scene && !reduceMotion && "is-active",
                  )}
                  style={
                    index === scene
                      ? { animationPlayState: playing ? "running" : "paused" }
                      : undefined
                  }
                  onAnimationEnd={
                    index === scene
                      ? () => setScene((current) => (current + 1) % SCENES)
                      : undefined
                  }
                />
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Caption({ text }: { text: string }) {
  return <p className="reel__caption">{text}</p>;
}

/** 1. Logo nuqtalardan chiziladi. */
function SceneHello({ text }: { text: string }) {
  const { x, y, width, height } = LOGO_VIEWBOX;
  return (
    <>
      <svg viewBox={`${x} ${y} ${width} ${height}`} overflow="visible" className="reel-logo">
        <path d={LETTERS_D} className="reel-logo__line" pathLength={1} />
        <path d={LETTERS_D} className="reel-logo__dots" />
        <rect {...CARET} className="reel-logo__caret" />
      </svg>
      <Caption text={text} />
    </>
  );
}

/** 2. Tarqoq nuqtalar bitta tekis chiziqqa terilib, tartibga keladi. */
function SceneSimple({ text }: { text: string }) {
  return (
    <>
      <div className="reel-knot">
        {Array.from({ length: 9 }, (_, index) => (
          <span key={index} style={{ "--i": index } as React.CSSProperties} />
        ))}
      </div>
      <Caption text={text} />
    </>
  );
}

/** 3. Nima beramiz: uchta kartochka navbat bilan chiqadi. */
function SceneOffer({ items }: { items: string[] }) {
  const icons = [PlayCircle, CodeXml, Users];
  return (
    <ul className="reel-offer">
      {items.map((item, index) => (
        <li key={item} style={{ "--i": index } as React.CSSProperties}>
          {createElement(icons[index], { "aria-hidden": true, className: "size-6" })}
          {item}
        </li>
      ))}
    </ul>
  );
}

/** 4. Uch til — uch pufakcha, bir-biriga ulanadi. */
function SceneLanguages({ text }: { text: string }) {
  return (
    <>
      <div className="reel-langs">
        <span style={{ "--i": 0 } as React.CSSProperties}>Salom!</span>
        <span style={{ "--i": 1 } as React.CSSProperties}>Привет!</span>
        <span style={{ "--i": 2 } as React.CSSProperties}>Hello!</span>
      </div>
      <Caption text={text} />
    </>
  );
}

/** 5. Birinchi qator kod yoziladi va natija chiqadi. */
function SceneCode({ text }: { text: string }) {
  return (
    <>
      <div className="reel-code">
        <p className="reel-code__line">
          <span className="reel-code__typed">
            <span className="tok-fn">print</span>(
            <span className="tok-str">&quot;Salom, dunyo!&quot;</span>)
          </span>
          <span className="reel-code__caret" />
        </p>
        <p className="reel-code__out">Salom, dunyo!</p>
      </div>
      <Caption text={text} />
    </>
  );
}
