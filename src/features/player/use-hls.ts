"use client";

import type Hls from "hls.js";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

export type Quality = { index: number; height: number };

type Options = {
  src: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  onError: () => void;
};

/**
 * HLS'ni ulaydi.
 *
 * Avval hls.js sinaladi, so'ng brauzerning o'z HLS'i (iOS Safari). Tartib shunday, chunki
 * ba'zi brauzerlar `canPlayType` ga "maybe" deydi-yu, aslida HLS'ni o'ynata olmaydi —
 * o'shanda video "manba yo'q" bo'lib qoladi.
 *
 * hls.js dinamik import qilinadi: kutubxona faqat dars sahifasida yuklanadi. Playlist va
 * shifrlash kaliti backend orqali (same-origin cookie bilan), segmentlar esa imzolangan
 * havolalar bilan storage'dan keladi.
 */
export function useHls({ src, videoRef, onError }: Options) {
  const instance = useRef<Hls | null>(null);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [level, setLevel] = useState(-1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    let cancelled = false;

    void import("hls.js").then(({ default: HlsLib }) => {
      if (cancelled) return;

      if (!HlsLib.isSupported()) {
        // iOS Safari: HLS'ni o'zi o'ynatadi, sifatni ham o'zi tanlaydi.
        if (video.canPlayType("application/vnd.apple.mpegurl")) video.src = src;
        else onError();
        return;
      }

      const hls = new HlsLib({
        // Sekin internetda ham uzilmasligi uchun bufer oldindan to'ldiriladi.
        maxBufferLength: 30,
        startLevel: -1,
      });
      hls.on(HlsLib.Events.MANIFEST_PARSED, () => {
        setQualities(hls.levels.map((entry, index) => ({ index, height: entry.height })).reverse());
      });
      hls.on(HlsLib.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        // Sabab konsolda qoladi: qo'llab-quvvatlash uchun kerak bo'ladi.
        console.error("HLS", data.type, data.details, data.error?.message);
        onError();
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      instance.current = hls;
    });

    return () => {
      cancelled = true;
      instance.current?.destroy();
      instance.current = null;
      setQualities([]);
      setLevel(-1);
    };
  }, [src, videoRef, onError]);

  /** `-1` — avtomatik sifat (internet tezligiga qarab). */
  const selectQuality = useCallback((index: number) => {
    if (instance.current) instance.current.currentLevel = index;
    setLevel(index);
  }, []);

  return { qualities, level, selectQuality };
}
