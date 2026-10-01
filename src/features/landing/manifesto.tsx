"use client";

import { type CSSProperties, Fragment, useEffect, useRef } from "react";

/**
 * Manifest: o'qilgan sari so'zlar birin-ketin yonadi (scroll progressi `--p` CSS o'zgaruvchisida).
 * Serverda `--p: 1` — JS bo'lmasa yoki animatsiya o'chiq bo'lsa, matn to'liq ko'rinadi.
 */
export function Manifesto({ text }: { text: string }) {
  const element = useRef<HTMLParagraphElement>(null);
  const words = text.split(/\s+/).filter(Boolean);

  useEffect(() => {
    const node = element.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const start = window.innerHeight * 0.85;
      const end = window.innerHeight * 0.4;
      const progress = (start - rect.top) / (rect.height + start - end);
      node.style.setProperty("--p", Math.min(Math.max(progress, 0), 1).toFixed(3));
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
    <p ref={element} className="manifesto" style={{ "--p": 1 } as CSSProperties}>
      {words.map((word, index) => (
        <Fragment key={index}>
          <span
            className="manifesto__word"
            style={{ "--w": (index / words.length).toFixed(3) } as CSSProperties}
          >
            {word}
          </span>{" "}
        </Fragment>
      ))}
    </p>
  );
}
