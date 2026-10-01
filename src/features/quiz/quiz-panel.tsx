"use client";

import {
  ArrowRight,
  Check,
  Clapperboard,
  Flame,
  ListChecks,
  Loader2,
  Pause,
  RotateCcw,
  Send,
  Star,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";

import {
  asDraft,
  describe,
  firstOpen,
  problemOf,
  streak,
  type Attempt,
  type Finish,
  type Result,
  type Summary,
} from "./logic";
import { QuizStep } from "./quiz-step";

type Results = Record<number, Result>;
type Stage =
  | { name: "card" }
  | { name: "play"; attempt: Attempt; results: Results; index: number }
  | { name: "done"; attempt: Attempt; results: Results; finish: Finish };

/**
 * Darsdagi test: karta (eng yaxshi natija, yulduzlar) → savollar ketma-ket, har javobdan keyin
 * faqat to'g'ri/noto'g'ri → yakun (foiz, yulduzlar; o'tilsa — xatolar ustida ishlash). Asosiy
 * yo'l — Telegram bot (tugmalar bilan, telefonda qulay), sayt — zaxira. Yakundan keyin sahifa
 * serverdan yangilanadi: dars "tugatildi" belgisi va dasturdagi yulduzlar bir joydan keladi.
 */
export function QuizPanel({ quiz, nextHref }: { quiz: Summary; nextHref: string | null }) {
  const t = useTranslations("LessonQuiz");
  const router = useRouter();
  const titleId = useId();
  const title = useRef<HTMLHeadingElement>(null);
  const [stage, setStage] = useState<Stage>({ name: "card" });
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const returning = useRef(false);

  // Test yopilganda fokus sarlavhaga qaytadi (sahifa birinchi ochilganda — yo'q).
  useEffect(() => {
    if (stage.name === "card" && returning.current) title.current?.focus();
    returning.current = stage.name !== "card";
  }, [stage.name]);

  async function finish(attempt: Attempt, results: Results) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { data, error: failure } = await api.POST("/api/v1/quiz-attempts/{id}/finish/", {
        params: { path: { id: attempt.id } },
      });
      if (!data) {
        setError(problemOf(failure) ?? t("errors.server"));
        return;
      }
      setStage({ name: "done", attempt, results, finish: data });
      router.refresh();
    } catch {
      setError(t("errors.network"));
    } finally {
      setBusy(false);
    }
  }

  async function begin(fresh: boolean) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { data, error: failure } = await api.POST("/api/v1/quizzes/{id}/attempts/", {
        params: { path: { id: quiz.id }, query: fresh ? { new: true } : undefined },
      });
      if (!data) {
        setError(problemOf(failure) ?? t("errors.server"));
        return;
      }
      const results: Results = Object.fromEntries(
        data.answers.map((item) => [item.question, item]),
      );
      const index = firstOpen(data.questions, results);
      // Hamma savolga javob berilgan, lekin yakunlanmagan (masalan, internet uzilgan) — yakunlaymiz.
      if (index >= data.questions.length) {
        await finish(data, results);
        return;
      }
      setStage({ name: "play", attempt: data, results, index });
    } catch {
      setError(t("errors.network"));
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setStage({ name: "card" });
    router.refresh();
  }

  /** Botda shu test ochiladi (bir martalik havola). Yangi oyna ochilmasa — shu oynada. */
  async function openTelegram() {
    if (opening) return;
    setOpening(true);
    setError(null);
    try {
      const { data, error: failure } = await api.POST("/api/v1/bot/quizzes/{id}/link/", {
        params: { path: { id: quiz.id } },
      });
      if (!data) {
        setError(problemOf(failure) ?? t("telegramFailed"));
        return;
      }
      const tab = window.open(data.url, "_blank");
      if (tab) tab.opener = null;
      else window.location.assign(data.url);
    } catch {
      setError(t("errors.network"));
    } finally {
      setOpening(false);
    }
  }

  return (
    <section id="quiz" aria-labelledby={titleId} className="quiz" data-stage={stage.name}>
      <header className="quiz-head">
        <span aria-hidden className="quiz-head__icon">
          <ListChecks className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{t("eyebrow")}</p>
          <h2 ref={title} id={titleId} tabIndex={-1} className="app-section-title">
            {quiz.title}
          </h2>
        </div>
        {stage.name === "card" && quiz.attempts > 0 && <Stars count={quiz.stars} />}
        {stage.name === "play" && (
          <Button
            type="button"
            variant="ghost"
            onClick={close}
            className="h-9 gap-1.5 rounded-full px-3 text-muted-foreground"
          >
            <Pause aria-hidden className="size-4" />
            {t("pause")}
          </Button>
        )}
      </header>

      {stage.name === "card" && (
        <div className="quiz-card">
          <p className="quiz-meta">
            {t("meta", { count: quiz.questions, percent: quiz.pass_percent })}
          </p>
          {quiz.attempts > 0 ? (
            <p className="quiz-best">
              <span className="quiz-chip" data-passed={quiz.passed ? "" : undefined}>
                {quiz.passed ? t("passed") : t("notPassed")}
              </span>
              {quiz.best_score !== null && <span>{t("best", { score: quiz.best_score })}</span>}
              <span className="text-muted-foreground">
                {t("attempts", { count: quiz.attempts })}
              </span>
            </p>
          ) : (
            <p className="quiz-note">{t("hintComplete")}</p>
          )}
          <div className="quiz-actions">
            {quiz.telegram && (
              <Button
                type="button"
                onClick={() => void openTelegram()}
                disabled={opening}
                className="h-11 gap-2 rounded-full px-5 text-base"
              >
                {opening ? (
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                ) : (
                  <Send aria-hidden className="size-4" />
                )}
                {t("telegram")}
              </Button>
            )}
            <Button
              type="button"
              variant={quiz.telegram ? "outline" : "default"}
              onClick={() => void begin(false)}
              disabled={busy}
              className="h-11 gap-2 rounded-full px-5 text-base"
            >
              {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
              {quiz.telegram
                ? quiz.in_progress
                  ? t("siteResume")
                  : t("site")
                : quiz.in_progress
                  ? t("resume")
                  : quiz.attempts > 0
                    ? t("retry")
                    : t("start")}
            </Button>
            {quiz.in_progress && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => void begin(true)}
                disabled={busy}
                className="h-11 rounded-full px-4"
              >
                {t("restart")}
              </Button>
            )}
          </div>
          {quiz.telegram && <p className="quiz-note">{t("telegramHint")}</p>}
        </div>
      )}

      {stage.name === "play" && (
        <Play
          stage={stage}
          busy={busy}
          onAnswered={(result) =>
            setStage({ ...stage, results: { ...stage.results, [result.question]: result } })
          }
          onNext={() => {
            const next = stage.index + 1;
            if (next < stage.attempt.questions.length) setStage({ ...stage, index: next });
            else void finish(stage.attempt, stage.results);
          }}
        />
      )}

      {stage.name === "done" && (
        <Done
          stage={stage}
          busy={busy}
          nextHref={nextHref}
          onRetry={() => void begin(true)}
          onClose={close}
        />
      )}

      {error && (
        <p role="alert" className="quiz-error">
          {error}
        </p>
      )}
    </section>
  );
}

function Play({
  stage,
  busy,
  onAnswered,
  onNext,
}: {
  stage: Extract<Stage, { name: "play" }>;
  busy: boolean;
  onAnswered: (result: Result) => void;
  onNext: () => void;
}) {
  const t = useTranslations("LessonQuiz");
  const { attempt, results, index } = stage;
  const question = attempt.questions[index];
  const combo = streak(attempt.questions, results);

  return (
    <div className="quiz-play">
      <div className="quiz-progress">
        <p className="quiz-progress__label">
          {t("progress", { current: index + 1, total: attempt.questions.length })}
        </p>
        {combo >= 2 && (
          <p key={combo} className="quiz-streak">
            <Flame aria-hidden className="size-4" />
            {t("streak", { count: combo })}
          </p>
        )}
      </div>
      {/* Test yuritgichi uslubida: ✓ / ✗ / kursor — qayerdasiz va qanday ketyapti. */}
      <ol className="quiz-track" aria-hidden>
        {attempt.questions.map((item, position) => {
          const done = results[item.id];
          const state = done
            ? done.correct
              ? "right"
              : "wrong"
            : position === index
              ? "current"
              : "todo";
          return (
            <li key={item.id} data-state={state}>
              {state === "right" && <Check className="size-3.5" />}
              {state === "wrong" && <X className="size-3.5" />}
              {state === "current" && <span className="quiz-track__caret" />}
            </li>
          );
        })}
      </ol>
      <QuizStep
        key={question.id}
        attemptId={attempt.id}
        question={question}
        result={results[question.id]}
        last={index === attempt.questions.length - 1}
        onAnswered={onAnswered}
        onNext={onNext}
      />
      {busy && (
        <p className="quiz-note" role="status">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          {t("finishing")}
        </p>
      )}
    </div>
  );
}

function Done({
  stage,
  busy,
  nextHref,
  onRetry,
  onClose,
}: {
  stage: Extract<Stage, { name: "done" }>;
  busy: boolean;
  nextHref: string | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("LessonQuiz");
  const heading = useRef<HTMLHeadingElement>(null);
  const { attempt, finish } = stage;
  // To'g'ri javoblar faqat test o'tilgach keladi (`review`): o'tmaganda bo'sh.
  const review = new Map(finish.review.map((item) => [item.question, item]));
  const mistakes = attempt.questions.filter(
    (question) => review.get(question.id)?.correct === false,
  );

  useEffect(() => heading.current?.focus(), []);

  function watchAgain() {
    const video = document.getElementById("lesson-video");
    if (!video) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    video.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  return (
    <div className="quiz-done">
      <div className="quiz-result" data-passed={finish.passed ? "" : undefined}>
        <Stars count={finish.stars} large />
        <h3 ref={heading} tabIndex={-1} className="quiz-result__score">
          {finish.score}%
        </h3>
        <p className="quiz-result__title">{t(`result.${Math.min(finish.stars, 3)}`)}</p>
        <p className="quiz-result__meta">
          <span className="quiz-tally" data-kind="right">
            <Check aria-hidden className="size-3.5" />
            {finish.correct}
          </span>
          <span className="quiz-tally" data-kind="wrong">
            <X aria-hidden className="size-3.5" />
            {finish.total - finish.correct}
          </span>
          <span className="sr-only">
            {t("score", { correct: finish.correct, total: finish.total })}
          </span>
          <span>
            {finish.passed ? t("lessonDone") : t("passMark", { percent: attempt.pass_percent })}
          </span>
        </p>
        {finish.best_score > finish.score && (
          <p className="text-sm text-muted-foreground">{t("best", { score: finish.best_score })}</p>
        )}
        {!finish.passed && <p className="quiz-result__hint">{t("tryAgain")}</p>}
        <div className="quiz-actions justify-center">
          {finish.passed && nextHref && (
            <Button asChild className="h-11 gap-2 rounded-full px-5 text-base">
              <Link href={nextHref}>
                {t("nextLesson")}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </Button>
          )}
          <Button
            type="button"
            variant={finish.passed && nextHref ? "outline" : "default"}
            onClick={onRetry}
            disabled={busy}
            className="h-11 gap-2 rounded-full px-5 text-base"
          >
            <RotateCcw aria-hidden className="size-4" />
            {t("retry")}
          </Button>
          {!finish.passed && (
            <Button
              type="button"
              variant="outline"
              onClick={watchAgain}
              className="h-11 gap-2 rounded-full px-5 text-base"
            >
              <Clapperboard aria-hidden className="size-4" />
              {t("watchAgain")}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-11 rounded-full px-4"
          >
            {t("close")}
          </Button>
        </div>
      </div>

      {mistakes.length > 0 && (
        <div className="quiz-mistakes">
          <h4 className="font-semibold">{t("mistakes")}</h4>
          <ol>
            {mistakes.map((question) => {
              const item = review.get(question.id);
              if (!item) return null;
              const yours = describe(question, asDraft(item.response)).filter(Boolean);
              return (
                <li key={question.id}>
                  <p className="quiz-mistakes__question">{question.text}</p>
                  <p className="quiz-mistakes__label">{t("yourAnswerWas")}</p>
                  <ul data-kind="yours">
                    {yours.length ? (
                      yours.map((line) => <li key={line}>{line}</li>)
                    ) : (
                      <li>{t("noAnswer")}</li>
                    )}
                  </ul>
                  <p className="quiz-mistakes__label">{t(`correct.${question.kind}`)}</p>
                  <ul>
                    {describe(question, asDraft(item.correct_answer ?? {})).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  {item.explanation && <p className="quiz-mistakes__text">{item.explanation}</p>}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

function Stars({ count, large = false }: { count: number; large?: boolean }) {
  const t = useTranslations("LessonQuiz");
  return (
    <p
      className="quiz-stars"
      data-large={large ? "" : undefined}
      role="img"
      aria-label={t("stars", { count })}
    >
      {[0, 1, 2].map((index) => (
        <Star
          key={index}
          aria-hidden
          data-on={index < count ? "" : undefined}
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </p>
  );
}
