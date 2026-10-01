"use client";

import { Play } from "lucide-react";
import { useRef, useState } from "react";

type PromoVideoProps = {
  src: string;
  poster: string | null;
  label: string;
  playLabel: string;
};

/** Admin yuklagan promo video: bosilgunga qadar yuklanmaydi (`preload="none"`). */
export function PromoVideo({ src, poster, label, playLabel }: PromoVideoProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  function start() {
    setStarted(true);
    void video.current?.play();
  }

  return (
    <div className="media-frame">
      <video
        ref={video}
        src={src}
        poster={poster ?? undefined}
        controls={started}
        preload="none"
        playsInline
        aria-label={label}
        className="absolute inset-0 size-full object-cover"
      />
      {!started && (
        <button type="button" onClick={start} aria-label={playLabel} className="media-frame__play">
          <span className="play-orb">
            <Play aria-hidden className="size-7 translate-x-0.5 fill-current" />
          </span>
          <span className="media-frame__label">{playLabel}</span>
        </button>
      )}
    </div>
  );
}
