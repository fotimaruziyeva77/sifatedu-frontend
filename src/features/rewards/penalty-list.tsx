"use client";

import { Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/schema";
import { stamp } from "@/lib/format";

type Penalty = components["schemas"]["Penalty"];

/**
 * O'qituvchi: guruh o'quvchilarining oxirgi 30 kundagi shtraflari. "Bekor qilish" — sababi
 * so'raladi, XP o'quvchiga qaytadi.
 */
export function PenaltyList({ initial }: { initial: Penalty[] }) {
  const t = useTranslations("Rewards");
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cancel(item: Penalty) {
    const reason = window.prompt(t("cancelPrompt", { name: item.student_name }))?.trim();
    if (!reason) return;
    setBusy(item.id);
    setError(null);
    try {
      const { data, error: failure } = await api.POST("/api/v1/teacher/penalties/{id}/cancel/", {
        params: { path: { id: item.id } },
        body: { reason },
      });
      if (data) setItems((current) => current.map((row) => (row.id === data.id ? data : row)));
      else setError(readApiError(failure)?.message ?? t("errors.server"));
    } catch {
      setError(t("errors.network"));
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground">{t("penaltiesEmpty")}</p>;
  }
  return (
    <>
      <ul className="rw-history">
        {items.map((item) => (
          <li key={item.id} data-penalty="" data-canceled={item.canceled ? "" : undefined}>
            <div className="min-w-0">
              <p className="rw-history__reason">
                {item.student_name} — {t(`reason.${item.reason}`)}
              </p>
              <p className="rw-history__meta">
                {stamp(item.created_at)}
                {item.note && ` · ${item.note}`}
              </p>
              {item.canceled && (
                <p className="rw-history__canceled">
                  {t("canceled", { reason: item.cancel_reason || "—" })}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="rw-history__amount">{t("minusXp", { value: Math.abs(item.xp) })}</p>
              {item.can_cancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void cancel(item)}
                  disabled={busy === item.id}
                  className="h-9 gap-1.5 rounded-full px-3"
                  aria-label={t("cancelLabel", { name: item.student_name })}
                >
                  <Undo2 aria-hidden className="size-4" />
                  {t("cancelPenalty")}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="quiz-error mt-2">
          {error}
        </p>
      )}
    </>
  );
}
