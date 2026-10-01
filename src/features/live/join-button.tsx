"use client";

import { Clock, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/**
 * "Qo'shilish": dars boshlanishidan 15 daqiqa oldin ochiladi. Sahifa ochiq qolsa, vaqti
 * kelganda o'zi yoqiladi. Havola platforma orqali o'tadi — backend kelganini yozib, Meet'ga
 * yo'naltiradi. Birinchi ko'rinish server hisobiga mos (gidratsiya farqi bo'lmaydi).
 */
export function JoinButton({
  href,
  opensAt,
  endsAt,
  open: initial,
  opensLabel,
  size = "default",
}: {
  href: string;
  opensAt: string;
  endsAt: string;
  /** Server hisobida hozir ochiqmi. */
  open: boolean;
  /** "17:45" — qachon ochilishi (serverda formatlangan). */
  opensLabel: string;
  size?: "default" | "large";
}) {
  const t = useTranslations("Schedule");
  const [state, setState] = useState<"waiting" | "open" | "ended">(initial ? "open" : "waiting");

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      if (now >= Date.parse(endsAt)) setState("ended");
      else setState(now >= Date.parse(opensAt) ? "open" : "waiting");
    };
    tick();
    const timer = window.setInterval(tick, 20_000);
    return () => window.clearInterval(timer);
  }, [opensAt, endsAt]);

  if (state === "ended") return null;
  if (state === "waiting") {
    return (
      <span className="live-join" data-size={size} aria-disabled="true">
        <Clock aria-hidden className="size-4" />
        {t("opensAt", { time: opensLabel })}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="live-join"
      data-size={size}
      data-open=""
    >
      <Video aria-hidden className="size-4" />
      {t("join")}
    </a>
  );
}
