"use client";

import { ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";

/**
 * O'qituvchining qarori: "Qabul qilish" (baho 0–100 va izoh) yoki "Qayta ishlashga qaytarish"
 * (izoh majburiy). Saqlangach — navbatdagi keyingi javobga o'tish.
 */
export function ReviewForm({
  submissionId,
  nextId,
}: {
  submissionId: number;
  nextId: number | null;
}) {
  const t = useTranslations("Reviews");
  const router = useRouter();
  const ids = useId();
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function decide(decision: "accept" | "return") {
    setError(null);
    const value = score.trim() === "" ? null : Number(score);
    if (
      decision === "accept" &&
      (value === null || !Number.isInteger(value) || value < 0 || value > 100)
    ) {
      setError(t("errors.score"));
      return;
    }
    if (decision === "return" && !feedback.trim()) {
      setError(t("errors.feedback"));
      return;
    }
    setBusy(true);
    try {
      const { data, error: failure } = await api.POST("/api/v1/teacher/reviews/{id}/", {
        params: { path: { id: submissionId } },
        body: { decision, score: decision === "accept" ? value : null, feedback },
      });
      if (data) {
        setDone(true);
        router.refresh();
        return;
      }
      const parsed = readApiError(failure);
      setError(parsed?.fields?.non_field_errors?.[0] ?? parsed?.message ?? t("errors.server"));
    } catch {
      setError(t("errors.network"));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rv-done" role="status">
        <p className="font-medium">{t("saved")}</p>
        {nextId ? (
          <Button asChild className="h-11 w-fit gap-2 rounded-full px-5">
            <Link href={`/dashboard/reviews/${nextId}`}>
              {t("next")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        ) : (
          <Link href="/dashboard/reviews" className="note__link">
            {t("backToQueue")}
          </Link>
        )}
      </div>
    );
  }

  return (
    <form className="rv-form" onSubmit={(event) => event.preventDefault()} noValidate>
      <h2 className="app-section-title">{t("decision")}</h2>
      <div className="hw-field">
        <label htmlFor={`${ids}-score`}>{t("scoreLabel")}</label>
        <input
          id={`${ids}-score`}
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          value={score}
          onChange={(event) => setScore(event.target.value)}
          className="rv-score"
          aria-describedby={`${ids}-score-hint`}
        />
        <p id={`${ids}-score-hint`} className="text-xs text-muted-foreground">
          {t("scoreHint")}
        </p>
      </div>
      <label className="hw-field">
        <span>{t("feedback")}</span>
        <textarea
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          rows={5}
          maxLength={5000}
          placeholder={t("feedbackPlaceholder")}
        />
      </label>
      {error && (
        <p role="alert" className="hw-error">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => void decide("accept")}
          disabled={busy}
          className="h-11 gap-2 rounded-full px-5"
        >
          <CheckCircle2 aria-hidden />
          {t("accept")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void decide("return")}
          disabled={busy}
          className="h-11 gap-2 rounded-full px-5"
        >
          <RotateCcw aria-hidden />
          {t("return")}
        </Button>
      </div>
    </form>
  );
}
