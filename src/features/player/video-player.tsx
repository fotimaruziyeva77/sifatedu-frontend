"use client";

import {
  Gauge,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { clock } from "./time";
import { useHls } from "./use-hls";
import { useProgress } from "./use-progress";

import "./player.css";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SEEK_STEP = 5;
const VOLUME_STEP = 0.1;
const HOTKEYS = [" ", "k", "arrowleft", "arrowright", "arrowup", "arrowdown", "f", "m"];

export type PlayerProps = {
  lessonId: number;
  src: string;
  poster: string;
  /** Oxirgi to'xtagan joyi (soniya). */
  startAt: number;
  /** Video ustida ko'rinadigan belgi: kim ko'rayotgani. */
  watermark: string;
  /** Video tugaganda shu elementga (masalan, dars testiga) olib boradi. */
  nextAnchor?: string;
};

/**
 * Dars videosi: HLS, sifat va tezlik tanlash, klaviatura bilan boshqarish, oxirgi
 * to'xtagan joydan davom etish va progressni saqlash.
 */
export function VideoPlayer({
  lessonId,
  src,
  poster,
  startAt,
  watermark,
  nextAnchor,
}: PlayerProps) {
  const t = useTranslations("Learn");
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(startAt);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [full, setFull] = useState(false);
  const [broken, setBroken] = useState(false);
  const [menu, setMenu] = useState<"quality" | "speed" | null>(null);

  const onError = useCallback(() => setBroken(true), []);
  const { qualities, level, selectQuality } = useHls({ src, videoRef, onError });
  const save = useProgress(lessonId);

  // Oxirgi to'xtagan joyidan boshlanadi (bir marta, metadata kelganda).
  useEffect(() => {
    const video = videoRef.current;
    if (!video || startAt <= 0) return;
    const seek = () => {
      if (video.currentTime < 1) video.currentTime = startAt;
    };
    video.addEventListener("loadedmetadata", seek, { once: true });
    return () => video.removeEventListener("loadedmetadata", seek);
  }, [startAt]);

  // Video holatini kuzatish va progressni saqlash.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      setTime(video.currentTime);
      if (!video.paused) save(video.currentTime);
    };
    const onPlay = () => setPlaying(true);
    const onStop = () => {
      setPlaying(false);
      save(video.currentTime, true);
    };
    const onMeta = () => setDuration(video.duration || 0);
    const onVolume = () => setMuted(video.muted);
    // Video tugadi: keyingi qadam — dars testi (to'liq ekrandan chiqib, unga o'tamiz).
    const onEnded = () => {
      onStop();
      const target = nextAnchor ? document.getElementById(nextAnchor) : null;
      if (!target) return;
      const reveal = () => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      };
      if (document.fullscreenElement) void document.exitFullscreen().then(reveal, reveal);
      else reveal();
    };

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onStop);
    video.addEventListener("ended", onEnded);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("volumechange", onVolume);
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onStop);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("volumechange", onVolume);
    };
  }, [save, nextAnchor]);

  // Sahifa yopilganda yoki fonga o'tganda ham joy saqlanadi.
  useEffect(() => {
    const flush = () => {
      const video = videoRef.current;
      if (video) save(video.currentTime, true);
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [save]);

  useEffect(() => {
    const onFull = () => setFull(document.fullscreenElement === shellRef.current);
    document.addEventListener("fullscreenchange", onFull);
    return () => document.removeEventListener("fullscreenchange", onFull);
  }, []);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => setBroken(true));
    else video.pause();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(0, seconds), video.duration || 0);
  }, []);

  const seekBy = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (video) seekTo(video.currentTime + delta);
    },
    [seekTo],
  );

  const nudgeVolume = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.min(1, Math.max(0, video.volume + delta));
    if (video.volume > 0) video.muted = false;
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (video) video.muted = !video.muted;
  }, []);

  const setRate = useCallback((value: number) => {
    const video = videoRef.current;
    if (video) video.playbackRate = value;
    setSpeed(value);
  }, []);

  const goFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shellRef.current?.requestFullscreen().catch(() => undefined);
  }, []);

  // Klaviatura: bo'shliq/K — o'ynatish, ←/→ — 5 soniya, ↑/↓ — ovoz, F — ekran, M — ovoz.
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!HOTKEYS.includes(key)) return;
      event.preventDefault();
      if (key === " " || key === "k") toggle();
      else if (key === "arrowleft") seekBy(-SEEK_STEP);
      else if (key === "arrowright") seekBy(SEEK_STEP);
      else if (key === "arrowup") nudgeVolume(VOLUME_STEP);
      else if (key === "arrowdown") nudgeVolume(-VOLUME_STEP);
      else if (key === "f") goFullscreen();
      else if (key === "m") toggleMute();
    },
    [toggle, seekBy, nudgeVolume, goFullscreen, toggleMute],
  );

  if (broken) {
    return <p className="player-fallback">{t("playerError")}</p>;
  }

  return (
    <div
      ref={shellRef}
      className="player"
      data-playing={playing || undefined}
      onKeyDown={onKeyDown}
      tabIndex={-1}
    >
      <video
        ref={videoRef}
        className="player__video"
        poster={poster || undefined}
        playsInline
        preload="metadata"
        onClick={toggle}
      />

      {/* Ekrandan yozib olishni to'xtatmaydi, lekin kim yozganini ko'rsatadi. */}
      {watermark && (
        <span aria-hidden className="player__mark">
          {watermark}
        </span>
      )}

      <div className="player__bar">
        <button type="button" onClick={toggle} aria-label={playing ? t("pause") : t("play")}>
          {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
        </button>

        <input
          type="range"
          className="player__seek"
          min={0}
          max={Math.max(1, Math.floor(duration))}
          value={Math.floor(time)}
          aria-label={t("lesson")}
          onChange={(event) => seekTo(Number(event.target.value))}
        />

        <span className="player__time">
          {clock(time)} / {clock(duration)}
        </span>

        <button type="button" onClick={toggleMute} aria-label={muted ? t("unmute") : t("mute")}>
          {muted ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />}
        </button>

        <Picker
          open={menu === "speed"}
          onToggle={() => setMenu(menu === "speed" ? null : "speed")}
          label={t("speed")}
          icon={<Gauge aria-hidden />}
          items={SPEEDS.map((value) => ({
            key: String(value),
            label: `${value}×`,
            active: speed === value,
            onSelect: () => setRate(value),
          }))}
        />

        {qualities.length > 1 && (
          <Picker
            open={menu === "quality"}
            onToggle={() => setMenu(menu === "quality" ? null : "quality")}
            label={t("quality")}
            icon={<Settings2 aria-hidden />}
            items={[
              {
                key: "auto",
                label: t("auto"),
                active: level === -1,
                onSelect: () => selectQuality(-1),
              },
              ...qualities.map((quality) => ({
                key: String(quality.index),
                label: `${quality.height}p`,
                active: level === quality.index,
                onSelect: () => selectQuality(quality.index),
              })),
            ]}
          />
        )}

        <button type="button" onClick={() => seekTo(0)} aria-label={t("restart")}>
          <RotateCcw aria-hidden />
        </button>

        <button
          type="button"
          onClick={goFullscreen}
          aria-label={full ? t("exitFullscreen") : t("fullscreen")}
        >
          {full ? <Minimize aria-hidden /> : <Maximize aria-hidden />}
        </button>
      </div>
    </div>
  );
}

type PickerItem = { key: string; label: string; active: boolean; onSelect: () => void };

/** Sifat va tezlik menyusi: ikkalasi bir xil ko'rinishda. */
function Picker({
  open,
  onToggle,
  label,
  icon,
  items,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  icon: React.ReactNode;
  items: PickerItem[];
}) {
  return (
    <div className="player__picker">
      <button type="button" onClick={onToggle} aria-label={label} aria-expanded={open}>
        {icon}
      </button>
      {open && (
        <ul className="player__menu" aria-label={label}>
          {items.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                aria-current={item.active ? "true" : undefined}
                onClick={() => {
                  item.onSelect();
                  onToggle();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
