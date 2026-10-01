"use client";

import { useCallback, useEffect, useRef } from "react";

/** Progress har shu oraliqda saqlanadi: tez-tez so'rov yubormaslik uchun. */
const SAVE_EVERY_MS = 15_000;

/**
 * Dars progressini saqlaydi: davriy ravishda, pauzada va sahifadan chiqishda.
 *
 * `sendBeacon` ishlatilmaydi — unda CSRF sarlavhasini qo'yish imkoni yo'q. O'rniga
 * `fetch(..., { keepalive: true })`: sahifa yopilsa ham so'rov yuboriladi.
 */
export function useProgress(lessonId: number) {
  const lastSaved = useRef(0);
  const lastSentAt = useRef(0);

  const send = useCallback(
    (position: number, force = false) => {
      const seconds = Math.floor(position);
      if (!Number.isFinite(seconds) || seconds < 0) return;
      const now = Date.now();
      if (!force && (now - lastSentAt.current < SAVE_EVERY_MS || seconds === lastSaved.current)) {
        return;
      }
      lastSentAt.current = now;
      lastSaved.current = seconds;

      const csrf = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)?.[1];
      void fetch(`/api/v1/lessons/${lessonId}/progress/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "X-CSRFToken": decodeURIComponent(csrf) } : {}),
        },
        body: JSON.stringify({ position_sec: seconds }),
        credentials: "same-origin",
        keepalive: true,
      }).catch(() => {
        // Progress saqlanmasa dars to'xtamaydi: keyingi urinishda yuboriladi.
        lastSaved.current = -1;
      });
    },
    [lessonId],
  );

  // Boshqa darsga o'tilganda hisob noldan boshlanadi.
  useEffect(() => {
    lastSaved.current = 0;
    lastSentAt.current = 0;
  }, [lessonId]);

  return send;
}
