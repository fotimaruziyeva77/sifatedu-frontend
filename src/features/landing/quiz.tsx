"use client";

import { ArrowLeft, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { CONTACT_SECTION, QUIZ_SECTION } from "@/components/site/sections";
import type { Track } from "@/components/three/constellation";
import { Button } from "@/components/ui/button";
import { setQuizContext } from "@/features/assistant/store";
import { selectCourseForLead } from "@/features/leads/select-course";

import { trackColor } from "@/features/catalog/tracks";

export type QuizCourse = { slug: string; title: string; category: string; hours: number | null };

type Level = "new" | "user" | "coder";
type Answers = { track?: Track; level?: Level; hours?: number };

const TRACK_OPTIONS: [Track, string][] = [
  ["frontend", "q1frontend"],
  ["backend", "q1backend"],
  ["design", "q1design"],
  ["basics", "q1basics"],
];
const LEVEL_OPTIONS: [Level, string][] = [
  ["new", "q2new"],
  ["user", "q2user"],
  ["coder", "q2coder"],
];
/** Javob → haftasiga taxminiy soat (oraliq o'rtasi). */
const HOURS_OPTIONS: [number, string][] = [
  [4, "q3low"],
  [8, "q3mid"],
  [12, "q3high"],
];
const TOTAL = 3;

/**
 * Kasb testi: 3 savol → mos yo'nalish, kurs va haftalik vaqtga qarab taxminiy muddat.
 * Natija ariza formasida kursni oldindan tanlaydi.
 */
export function Quiz({ courses }: { courses: QuizCourse[] }) {
  const t = useTranslations("Quiz");
  const tTracks = useTranslations("Courses.tracks");
  const [step, setStep] = useState(0); // 0 — kirish, 1..3 — savollar, 4 — natija
  const [answers, setAnswers] = useState<Answers>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // Hero'dagi "Qaysi kasb menga mos?" havolasi testni darhol boshlaydi.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(`a[href="#${QUIZ_SECTION}"]`)) return;
      moved.current = true;
      setStep((current) => (current === 0 ? 1 : current));
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Har qadamda fokus sarlavhaga: klaviatura va ekran o'quvchi yangi savoldan boshlaydi.
  useEffect(() => {
    if (moved.current) heading.current?.focus({ preventScroll: true });
  }, [step]);

  function go(next: number) {
    moved.current = true;
    setStep(next);
  }

  function answer(patch: Answers) {
    const next = { ...answers, ...patch };
    setAnswers(next);
    if (step === TOTAL && next.track) {
      // Natija AI maslahatchiga ham boradi: "natijam bo'yicha maslahat" shu ma'lumot bilan.
      const level = LEVEL_OPTIONS.find(([value]) => value === next.level)?.[1];
      const hours = HOURS_OPTIONS.find(([value]) => value === next.hours)?.[1];
      setQuizContext({
        track: tTracks(next.track),
        level: level ? t(level) : "",
        hours: hours ? t(hours) : "",
        course: courses.find((item) => item.category === next.track)?.title ?? "",
      });
    }
    go(step + 1);
  }

  function restart() {
    setAnswers({});
    setQuizContext(null);
    go(1);
  }

  const course = answers.track
    ? courses.find((item) => item.category === answers.track)
    : undefined;
  const basics = courses.find((item) => item.category === "basics");
  const tip =
    answers.level === "new" &&
    (answers.track === "frontend" || answers.track === "backend") &&
    basics &&
    course &&
    basics.slug !== course.slug
      ? basics
      : undefined;
  const weeks =
    course?.hours && answers.hours ? Math.max(1, Math.ceil(course.hours / answers.hours)) : null;

  const announcement =
    step === 4 && answers.track
      ? t("announce", { track: tTracks(answers.track) })
      : step > 0
        ? t("progress", { current: step, total: TOTAL })
        : "";

  return (
    <div
      id={QUIZ_SECTION}
      data-reveal
      className="quiz"
      style={
        answers.track ? ({ "--track": trackColor(answers.track) } as CSSProperties) : undefined
      }
    >
      <div aria-hidden className="quiz__glow" />
      <div className="quiz__head">
        <p className="eyebrow flex items-center gap-2">
          <Sparkles aria-hidden className="size-3.5 text-caret" />
          {t("eyebrow")}
        </p>
        {step > 0 && step <= TOTAL && (
          <ol aria-label={t("progress", { current: step, total: TOTAL })} className="quiz-progress">
            {Array.from({ length: TOTAL }, (_, index) => (
              <li
                key={index}
                data-state={index + 1 < step ? "done" : index + 1 === step ? "current" : "todo"}
              />
            ))}
          </ol>
        )}
      </div>

      <div key={step} className="quiz__step">
        {step === 0 && (
          <>
            <h3 ref={heading} tabIndex={-1} className="quiz__title">
              {t("title")}
            </h3>
            <p className="mt-3 max-w-xl text-pretty text-muted-foreground">{t("text")}</p>
            <Button
              type="button"
              onClick={() => go(1)}
              data-magnetic
              className="mt-7 h-12 gap-2 rounded-full px-6 text-base"
            >
              {t("start")}
              <ArrowRight aria-hidden />
            </Button>
          </>
        )}

        {step === 1 && (
          <Question
            title={t("q1")}
            headingRef={heading}
            options={TRACK_OPTIONS.map(([value, key]) => ({
              label: t(key),
              selected: answers.track === value,
              onSelect: () => answer({ track: value }),
              color: trackColor(value),
            }))}
          />
        )}
        {step === 2 && (
          <Question
            title={t("q2")}
            headingRef={heading}
            options={LEVEL_OPTIONS.map(([value, key]) => ({
              label: t(key),
              selected: answers.level === value,
              onSelect: () => answer({ level: value }),
            }))}
          />
        )}
        {step === 3 && (
          <Question
            title={t("q3")}
            headingRef={heading}
            options={HOURS_OPTIONS.map(([value, key]) => ({
              label: t(key),
              selected: answers.hours === value,
              onSelect: () => answer({ hours: value }),
            }))}
          />
        )}

        {step >= 1 && step <= TOTAL && (
          <button type="button" onClick={() => go(step - 1)} className="quiz__back">
            <ArrowLeft aria-hidden className="size-4" />
            {t("back")}
          </button>
        )}

        {step === 4 && answers.track && (
          <>
            <p className="eyebrow">{t("result")}</p>
            <h3 ref={heading} tabIndex={-1} className="quiz__title mt-3 flex items-center gap-3">
              <span aria-hidden className="quiz__track-dot" />
              {tTracks(answers.track)}
            </h3>
            {course ? (
              <>
                <p className="mt-4 text-lg font-semibold text-balance">{course.title}</p>
                {weeks && (
                  <p className="mt-2 text-muted-foreground">
                    {t("resultWeeks", { hours: answers.hours ?? 0, weeks })}
                  </p>
                )}
                {tip && <p className="quiz__tip">{t("resultTip", { course: tip.title })}</p>}
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    data-magnetic
                    onClick={() => selectCourseForLead(course.slug)}
                    className="h-12 gap-2 rounded-full px-6 text-base"
                  >
                    {t("resultCta")}
                    <ArrowRight aria-hidden />
                  </Button>
                  <RestartButton label={t("restart")} onClick={restart} />
                </div>
              </>
            ) : (
              <>
                <p className="mt-4 max-w-xl text-pretty text-muted-foreground">{t("resultNone")}</p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Button asChild className="h-12 gap-2 rounded-full px-6 text-base">
                    <a href={`#${CONTACT_SECTION}`}>
                      {t("resultNoneCta")}
                      <ArrowRight aria-hidden />
                    </a>
                  </Button>
                  <RestartButton label={t("restart")} onClick={restart} />
                </div>
              </>
            )}
          </>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

type Option = { label: string; selected: boolean; onSelect: () => void; color?: string };

function Question({
  title,
  options,
  headingRef,
}: {
  title: string;
  options: Option[];
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <>
      <h3 ref={headingRef} tabIndex={-1} className="quiz__title">
        {title}
      </h3>
      <div role="group" aria-label={title} className="quiz__options">
        {options.map((option, index) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={option.selected}
            onClick={option.onSelect}
            className="quiz__option"
            style={
              {
                "--i": index,
                ...(option.color ? { "--option": option.color } : {}),
              } as CSSProperties
            }
          >
            <span aria-hidden className="quiz__radio" />
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
}

function RestartButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="quiz__back mt-0">
      <RotateCcw aria-hidden className="size-4" />
      {label}
    </button>
  );
}
