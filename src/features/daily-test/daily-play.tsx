"use client";

import { Check, Flag, Loader2, Play, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { firstOpen, nextOpen } from "@/features/exams/logic";
import { blindResult, problemOf, type Result } from "@/features/quiz/logic";
import { QuizStep } from "@/features/quiz/quiz-step";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

import { DailyStrip } from "./daily-strip";

type Attempt = components["schemas"]["DailyAttempt"];
type Outcome = components["schemas"]["DailyResult"];
type Saved = Record<number, Result>;
type Stage =
  | { name: "card" }
  | { name: "play"; attempt: Attempt; saved: Saved; index: number; endsAt: number }
  | { name: "done"; outcome: Outcome };

/**
 * Kunlik testni saytda ishlash. Urinish bot bilan bitta: botda boshlangan test shu yerda davom
 * etadi va aksincha. Javobdan keyin baho yo'q — oxirida to'g'ri va noto'g'ri soni; to'g'ri
 * javoblar va izohlar test yopilgach (23:00). Vaqt tugasa, berilgan javoblar bilan yakunlanadi.
 */
export function DailyPlay({
  testId,
  started,
  botUrl,
}: {
  testId: number;
  started: boolean;
  botUrl: string;
}) {
  const t = useTranslations("DailyTest");
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ name: "card" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finishing = useRef(false);

  const finish = useCallback(
    async (attempt: Attempt) => {
      if (finishing.current) return;
      finishing.current = true;
      setBusy(true);
      setError(null);
      try {
        const { data, error: failure } = await api.POST(
          "/api/v1/daily-test/attempts/{id}/finish/",
          { params: { path: { id: attempt.id } } },
        );
        if (data) {
          setStage({ name: "done", outcome: data });
          router.refresh();
        } else {
          finishing.current = false;
          setError(problemOf(failure) ?? t("errors.server"));
        }
      } catch {
        finishing.current = false;
        setError(t("errors.network"));
      } finally {
        setBusy(false);
      }
    },
    [router, t],
  );

  async function begin() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { data, error: failure } = await api.POST("/api/v1/daily-test/{id}/start/", {
        params: { path: { id: testId } },
      });
      if (!data) {
        setError(problemOf(failure) ?? t("errors.server"));
        router.refresh();
        return;
      }
      const saved: Saved = Object.fromEntries(
        data.answers.map((item) => [item.question, blindResult(item)]),
      );
      const ids = data.questions.map((question) => question.id);
      const answered = new Set(Object.keys(saved).map(Number));
      if (data.finished || answered.size >= ids.length) {
        await finish(data);
        return;
      }
      // Vaqt brauzer soatiga emas, server aytgan qoldiqqa qarab hisoblanadi.
      const endsAt = Date.now() + data.seconds_left * 1000;
      setStage({ name: "play", attempt: data, saved, index: firstOpen(ids, answered), endsAt });
    } catch {
      setError(t("errors.network"));
    } finally {
      setBusy(false);
    }
  }

  if (stage.name === "play") {
    return (
      <Player
        stage={stage}
        busy={busy}
        error={error}
        onChange={setStage}
        onFinish={(attempt) => void finish(attempt)}
      />
    );
  }

  if (stage.name === "done") {
    const { outcome } = stage;
    return (
      <div className="daily-result" role="status">
        <p className="daily-result__score">
          {outcome.correct}
          <span className="daily-result__total">/{outcome.total}</span>
        </p>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t("resultTitle")}</p>
          <p>{t("rightWrong", { right: outcome.correct, wrong: outcome.wrong })}</p>
          <DailyStrip
            correct={outcome.correct}
            total={outcome.total}
            label={t("stripLabel", { right: outcome.correct, total: outcome.total })}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            {outcome.xp > 0 && `${t("resultReward", { xp: outcome.xp, coins: outcome.coins })} · `}
            {t("resultPlace", { place: outcome.place, people: outcome.people })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-actions">
      <Button
        type="button"
        onClick={() => void begin()}
        disabled={busy}
        className="h-11 gap-2 rounded-full px-5"
      >
        {busy ? (
          <Loader2 aria-hidden className="size-4 animate-spin" />
        ) : (
          <Play aria-hidden className="size-4" />
        )}
        {started ? t("playResume") : t("playSite")}
      </Button>
      {botUrl && (
        <Button asChild variant="outline" className="h-11 gap-2 rounded-full px-5">
          <a href={botUrl} target="_blank" rel="noopener">
            <Send aria-hidden className="size-4" />
            {started ? t("continueInBot") : t("openInBot")}
          </a>
        </Button>
      )}
      {error && (
        <p role="alert" className="quiz-error w-full">
          {error}
        </p>
      )}
    </div>
  );
}

function Player({
  stage,
  busy,
  error,
  onChange,
  onFinish,
}: {
  stage: Extract<Stage, { name: "play" }>;
  busy: boolean;
  error: string | null;
  onChange: (stage: Stage) => void;
  onFinish: (attempt: Attempt) => void;
}) {
  const t = useTranslations("DailyTest");
  const { attempt, saved, index, endsAt } = stage;
  const [now, setNow] = useState(() => Date.now());
  const ids = attempt.questions.map((question) => question.id);
  const answered = new Set(Object.keys(saved).map(Number));
  const question = attempt.questions[index];
  const open = ids.length - answered.size;
  const next = nextOpen(ids, answered, index);
  const closed = endsAt <= now;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // Test yopildi (23:00) — berilgan javoblar bilan yakunlanadi.
  useEffect(() => {
    if (closed) onFinish(attempt);
  }, [closed, attempt, onFinish]);

  function go(target: number) {
    onChange({ ...stage, index: target });
  }

  function stop() {
    const message = open > 0 ? t("finishConfirmOpen", { count: open }) : t("finishConfirm");
    if (window.confirm(message)) onFinish(attempt);
  }

  return (
    <div className="exam-play">
      <div className="exam-bar">
        <p className="quiz-progress__label">
          {t("progress", { current: index + 1, total: ids.length, answered: answered.size })}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={stop}
          disabled={busy}
          className="h-9 gap-1.5 rounded-full px-3"
        >
          <Flag aria-hidden className="size-4" />
          {t("finish")}
        </Button>
      </div>

      <nav aria-label={t("questions")}>
        <ol className="exam-track">
          {attempt.questions.map((item, position) => {
            const done = answered.has(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => go(position)}
                  aria-current={position === index ? "step" : undefined}
                  aria-label={t(done ? "questionSaved" : "questionOpen", { number: position + 1 })}
                  data-state={done ? "saved" : position === index ? "current" : "todo"}
                >
                  {done ? <Check aria-hidden className="size-3.5" /> : position + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <QuizStep
        key={question.id}
        blind="daily"
        attemptId={attempt.id}
        question={question}
        result={saved[question.id]}
        last={next === -1 || next === index}
        onAnswered={(result) =>
          onChange({ ...stage, saved: { ...saved, [result.question]: result } })
        }
        onNext={() => {
          if (next === -1 || next === index) onFinish(attempt);
          else go(next);
        }}
        onSkip={next !== -1 && next !== index ? () => go(next) : undefined}
      />

      {busy && (
        <p className="quiz-note" role="status">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          {t("finishing")}
        </p>
      )}
      {error && (
        <p role="alert" className="quiz-error">
          {error}
        </p>
      )}
    </div>
  );
}
