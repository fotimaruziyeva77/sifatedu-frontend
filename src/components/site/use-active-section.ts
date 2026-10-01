"use client";

import { useEffect, useState } from "react";

/**
 * Ekran o'rtasidagi chiziq ichida turgan bo'lim id'si — menyuda "siz shu yerdasiz" kursori uchun.
 * Scroll'da hisoblanadi (IntersectionObserver tez scroll'da bo'limlarni o'tkazib yuborishi mumkin).
 * Kuzatilmaydigan joyda (hero, ariza formasi, huquqiy sahifalar) `null`.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const middle = window.innerHeight / 2;
      let current: string | null = null;
      for (const id of ids) {
        const rect = document.getElementById(id)?.getBoundingClientRect();
        if (rect && rect.top <= middle && rect.bottom > middle) {
          current = id;
          break;
        }
      }
      setActive(current);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ids]);

  return active;
}
