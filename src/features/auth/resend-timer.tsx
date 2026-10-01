"use client";

import { RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

function secondsLeft(until: number): number {
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

/**
 * "Kodni qayta yuborish" — taymer tugagach faollashadi. Qolgan vaqt tugash vaqtidan
 * hisoblanadi, shuning uchun tab fonda turganda ham to'g'ri qoladi.
 */
export function ResendTimer({
  until,
  onResend,
  disabled,
}: {
  until: number;
  onResend: () => void;
  disabled?: boolean;
}) {
  const t = useTranslations("Auth");
  const [left, setLeft] = useState(() => secondsLeft(until));

  useEffect(() => {
    if (secondsLeft(until) <= 0) return;
    const timer = globalThis.setInterval(() => setLeft(secondsLeft(until)), 1000);
    return () => globalThis.clearInterval(timer);
  }, [until]);

  if (left > 0) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t("resendIn", { seconds: left })}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={onResend}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline disabled:opacity-50"
    >
      <RotateCw aria-hidden className="size-4" />
      {t("resend")}
    </button>
  );
}
