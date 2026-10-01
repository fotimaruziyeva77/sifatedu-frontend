"use client";

import { Check, Clock, Flag, Loader2, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { blindResult, problemOf, type Result } from "@/features/quiz/logic";
import { QuizStep } from "@/features/quiz/quiz-step";

import { clock, firstOpen, nextOpen, timeWarning } from "./logic";

type Attempt = components["schemas"]["ExamAttempt"];
type Test = components["schemas"]["ExamTest"];
type Saved = Record<number, Result>;
type Stage =
  | { name: "card" }
  | { name: "play"; attempt: Attempt; saved: Saved; index: number; endsAt: number }
  | { name: "done"; score: number };

/**
 * Oylik imtihonning test qismi: bitta urinish, vaqt serverda (sahifa yopilsa ham ketadi).
 * Javob "Saqlash" bilan yuboriladi, to'g'ri yoki noto'g'riligi imtihon yopilgach ko'rsatiladi.
 * Savolni keyinga qoldirish mumkin; vaqt tugasa test o'zi yakunlanadi.
 */
export function ExamTest({
  examId,
  test,
  canTake,
}: {
  examId: number;
  test: Test;
  canTake: boolean;
}) {
  const t = useTranslations("Exams");
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
        const { data, error: failure } = await api.POST("/api/v1/exam-attempts/{id}/finish/", {
          params: { path: { id: attempt.id } },
        });
        if (data) {
          setStage({ name: "done", score: data.score });
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
    if (!test.started && !window.confirm(t("startConfirm", { minutes: test.minutes }))) return;
    setBusy(true);
    setError(null);
    try {
      const { data, error: failure } = await api.POST("/api/v1/exams/{id}/test/", {
        params: { path: { id: examId } },
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
      // Vaqt brauzer soatiga emas, server aytgan qoldiqqa qarab hisoblanadi.
      const endsAt = Date.now() + data.seconds_left * 1000;
      if (answered.size >= ids.length) {
        await finish(data);
        return;
      }
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

  const score = stage.name === "done" ? stage.score : test.score;
  const finished = stage.name === "done" || test.finished;

  return (
    <div className="exam-test">
      {finished ? (
        <div className="exam-score" role="status">
          <p className="exam-score__value">{score ?? 0}%</p>
          <div>
            <p className="font-medium">{t("testDone")}</p>
            {test.review.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("revealLater")}</p>
            )}
          </div>
        </div>
      ) : canTake ? (
        <>
          <ul className="exam-rules">
            <li>{t("rules.count", { count: test.questions, minutes: test.minutes })}</li>
            <li>{t("rules.once")}</li>
            <li>{t("rules.blind")}</li>
            <li>{t("rules.bot")}</li>
          </ul>
          <div className="quiz-actions">
            <Button
              type="button"
              onClick={() => void begin()}
              disabled={busy}
              className="h-11 gap-2 rounded-full px-5 text-base"
            >
              {busy ? (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              ) : (
                <Play aria-hidden className="size-4" />
              )}
              {test.started ? t("resume", { time: clock(test.seconds_left) }) : t("start")}
            </Button>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">{t("testMissed")}</p>
      )}
      {error && (
        <p role="alert" className="quiz-error">
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
  const t = useTranslations("Exams");
  const { attempt, saved, index, endsAt } = stage;
  const [now, setNow] = useState(() => Date.now());
  const ids = attempt.questions.map((question) => question.id);
  const answered = new Set(Object.keys(saved).map(Number));
  const question = attempt.questions[index];
  const left = Math.max(0, Math.round((endsAt - now) / 1000));
  const warning = timeWarning(left);
  const open = ids.length - answered.size;
  const next = nextOpen(ids, answered, index);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Vaqt tugadi — berilgan javoblar bilan yakunlanadi.
  useEffect(() => {
    if (left === 0) onFinish(attempt);
  }, [left, attempt, onFinish]);

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
        <p className="exam-timer" data-low={warning ? "" : undefined}>
          <Clock aria-hidden className="size-4" />
          <span className="sr-only">{t("timeLeft")}</span>
          <time className="tabular-nums">{clock(left)}</time>
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
      <p aria-live="polite" className="sr-only">
        {warning === "one" ? t("oneMinute") : warning === "five" ? t("fiveMinutes") : ""}
      </p>

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
        blind
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
