"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { api } from "@/lib/api/client";

/** Sozlamalar: "Reytingda ko'rsatilmasin" — belgilansa darhol saqlanadi. */
export function RatingVisibility({ hidden }: { hidden: boolean }) {
  const t = useTranslations("Rewards");
  const [value, setValue] = useState(hidden);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"saved" | "failed" | null>(null);

  async function change(next: boolean) {
    setBusy(true);
    setStatus(null);
    setValue(next);
    try {
      const { data } = await api.PATCH("/api/v1/rewards/settings/", { body: { hidden: next } });
      if (data) {
        setValue(data.hidden);
        setStatus("saved");
      } else {
        setValue(!next);
        setStatus("failed");
      }
    } catch {
      setValue(!next);
      setStatus("failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="rating-visibility" className="app-card">
      <h2 id="rating-visibility" className="app-section-title">
        {t("visibilityTitle")}
      </h2>
      <label className="notify-check mt-4">
        <input
          type="checkbox"
          checked={value}
          disabled={busy}
          onChange={(event) => void change(event.target.checked)}
        />
        <span>
          {t("visibilityLabel")}
          <em>{t("visibilityHint")}</em>
        </span>
      </label>
      <p role="status" className="mt-2 text-sm text-muted-foreground">
        {status === "saved" ? t("saved") : status === "failed" ? t("errors.network") : ""}
      </p>
    </section>
  );
}
