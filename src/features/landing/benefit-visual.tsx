import type { CSSProperties } from "react";

import { NamedIcon } from "./icons";

/**
 * Bento plitkasidagi mini-animatsiya: afzallik belgisiga qarab (Advantage.icon).
 * Faqat CSS; plitkadagi `data-play` ekrandan chiqqanda to'xtatadi.
 */
export function BenefitVisual({ icon }: { icon: string }) {
  switch (icon) {
    case "video":
      return (
        <div aria-hidden className="bv bv-video">
          <span className="bv-video__play" />
          <span className="bv-video__bar">
            <span />
          </span>
        </div>
      );
    case "code":
      return (
        <div aria-hidden className="bv bv-code">
          {["72%", "48%", "64%"].map((width, index) => (
            <span
              key={width}
              style={{ "--w": width, "--i": index } as CSSProperties}
              className="bv-code__line"
            />
          ))}
        </div>
      );
    case "users":
      return (
        <div aria-hidden className="bv bv-people">
          <svg viewBox="0 0 160 70">
            <line x1="30" y1="40" x2="80" y2="22" pathLength={1} />
            <line x1="80" y1="22" x2="130" y2="44" pathLength={1} />
            <line x1="30" y1="40" x2="130" y2="44" pathLength={1} />
            <circle cx="30" cy="40" r="11" />
            <circle cx="80" cy="22" r="11" />
            <circle cx="130" cy="44" r="11" />
          </svg>
        </div>
      );
    case "languages":
      return (
        <div aria-hidden className="bv bv-langs">
          <span className="bv-langs__track">
            <span>Salom</span>
            <span>Привет</span>
            <span>Hello</span>
            <span>Salom</span>
          </span>
        </div>
      );
    case "wifi":
      return (
        <div aria-hidden className="bv bv-signal">
          {[0, 1, 2, 3].map((index) => (
            <span key={index} style={{ "--i": index } as CSSProperties} />
          ))}
          <span className="bv-signal__quality">
            <span>360p</span>
            <span>720p</span>
            <span>1080p</span>
          </span>
        </div>
      );
    case "infinity":
      return (
        <div aria-hidden className="bv bv-infinity">
          <svg viewBox="0 0 120 50">
            <path
              className="bv-infinity__base"
              d="M60 25c-10-14-20-19-31-19C17 6 8 14 8 25s9 19 21 19c11 0 21-5 31-19s20-19 31-19c12 0 21 8 21 19s-9 19-21 19c-11 0-21-5-31-19Z"
            />
            <path
              className="bv-infinity__run"
              pathLength={1}
              d="M60 25c-10-14-20-19-31-19C17 6 8 14 8 25s9 19 21 19c11 0 21-5 31-19s20-19 31-19c12 0 21 8 21 19s-9 19-21 19c-11 0-21-5-31-19Z"
            />
          </svg>
        </div>
      );
    default:
      return (
        <div aria-hidden className="bv bv-orbit">
          <NamedIcon name={icon} className="size-6" />
        </div>
      );
  }
}
