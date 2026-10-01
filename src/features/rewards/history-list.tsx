"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { stamp } from "@/lib/format";

type Entry = components["schemas"]["RewardEntry"];

/** "+10 XP", "−5 XP", "+50 coin": nol qismlar yozilmaydi. */
function amounts(entry: Entry, t: (key: string, values: { value: number }) => string): string[] {
  const parts: string[] = [];
  if (entry.xp) parts.push(t(entry.xp > 0 ? "plusXp" : "minusXp", { value: Math.abs(entry.xp) }));
  if (entry.coins)
    parts.push(t(entry.coins > 0 ? "plusCoins" : "minusCoins", { value: Math.abs(entry.coins) }));
  return parts;
}

/**
 * XP va coin tarixi: har o'zgarish sababi bilan; shtraf — qizil, bekor qilingani — chizilgan
 * (sababi bilan). "Ko'proq" — keyingi sahifa.
 */
export function HistoryList({ initial }: { initial: Entry[] }) {
  const t = useTranslations("Rewards");
  const [items, setItems] = useState(initial);
  const [page, setPage] = useState<number | null>(initial.length >= 10 ? 1 : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function more() {
    if (page === null || busy) return;
    setBusy(true);
    setError(false);
    try {
      const { data } = await api.GET("/api/v1/rewards/history/", {
        params: { query: { page } },
      });
      if (!data) {
        setError(true);
        return;
      }
      // Birinchi sahifa bosh ro'yxatni (10 ta) o'z ichiga oladi — almashtiriladi.
      setItems((current) => (page === 1 ? data.results : [...current, ...data.results]));
      setPage(data.next_page ?? null);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground">{t("historyEmpty")}</p>;
  }
  return (
    <>
      <ol className="rw-history">
        {items.map((entry) => (
          <li
            key={entry.id}
            data-penalty={entry.penalty ? "" : undefined}
            data-canceled={entry.canceled ? "" : undefined}
          >
            <div className="min-w-0">
              <p className="rw-history__reason">{t(`reason.${entry.reason}`)}</p>
              <p className="rw-history__meta">
                {stamp(entry.created_at)}
                {entry.course_title && ` · ${entry.course_title}`}
                {entry.note && ` · ${entry.note}`}
              </p>
              {entry.canceled && (
                <p className="rw-history__canceled">
                  {t("canceled", { reason: entry.cancel_reason || "—" })}
                </p>
              )}
            </div>
            <p className="rw-history__amount">{amounts(entry, t).join(" · ")}</p>
          </li>
        ))}
      </ol>
      {error && (
        <p role="alert" className="quiz-error">
          {t("errors.network")}
        </p>
      )}
      {page !== null && (
        <Button
          type="button"
          variant="outline"
          onClick={() => void more()}
          disabled={busy}
          className="mt-4 h-10 gap-2 rounded-full px-4"
        >
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {t("more")}
        </Button>
      )}
    </>
  );
}
