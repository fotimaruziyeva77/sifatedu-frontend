"use client";

import { CalendarClock, Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { SubmissionView } from "@/features/homework/submission-view";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/schema";

type Detail = components["schemas"]["TeacherExamDetail"];
type Row = components["schemas"]["TeacherRow"];
type Selection = { student: number; task: number } | { student: number; task: null };

function problem(body: unknown): string | null {
  const error = readApiError(body);
  return error?.fields?.non_field_errors?.[0] ?? (error?.message || null);
}

/** Birinchi baholanmagan javob (jadval tartibida). */
function firstUngraded(rows: Row[]): Selection | null {
  for (const row of rows) {
    const cell = row.tasks.find((item) => item.answer && item.answer.score === null);
    if (cell) return { student: row.student_id, task: cell.task_id };
  }
  return null;
}

/**
 * O'qituvchi: o'quvchilar × topshiriqlar jadvali. Katak bosilsa — javob va baholash formasi
 * (0–100, izoh); saqlangach keyingi baholanmagan javob ochiladi. Kelolmagan o'quvchiga —
 * alohida muddat.
 */
export function ExamGrading({ initial }: { initial: Detail }) {
  const t = useTranslations("TeacherExams");
  const [detail, setDetail] = useState(initial);
  const [selected, setSelected] = useState<Selection | null>(() => firstUngraded(initial.rows));
  const panel = useRef<HTMLDivElement>(null);
  const titles = new Map(detail.tasks.map((task) => [task.id, task]));
  const row = selected ? detail.rows.find((item) => item.student_id === selected.student) : null;

  function open(next: Selection) {
    setSelected(next);
    requestAnimationFrame(() => panel.current?.focus());
  }

  return (
    <>
      <div className="exam-grid-wrap">
        <table className="exam-grid">
          <caption className="sr-only">{t("tableCaption")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("student")}</th>
              <th scope="col">{t("test")}</th>
              {detail.tasks.map((task, index) => (
                <th key={task.id} scope="col" title={task.title}>
                  {t("taskShort", { number: index + 1 })}
                </th>
              ))}
              <th scope="col">{t("total")}</th>
              <th scope="col">{t("extension")}</th>
            </tr>
          </thead>
          <tbody>
            {detail.rows.map((item) => (
              <tr key={item.student_id}>
                <th scope="row">
                  <span className="block font-medium">{item.name}</span>
                  {item.group && (
                    <span className="block text-xs text-muted-foreground">{item.group}</span>
                  )}
                </th>
                <td className="tabular-nums">
                  {item.test_score !== null
                    ? `${item.test_score}%`
                    : item.test_started
                      ? t("testRunning")
                      : "—"}
                </td>
                {item.tasks.map((cell) => {
                  const answer = cell.answer;
                  const active =
                    selected?.student === item.student_id && selected.task === cell.task_id;
                  if (!answer) {
                    return (
                      <td key={cell.task_id} className="text-muted-foreground">
                        —
                      </td>
                    );
                  }
                  return (
                    <td key={cell.task_id}>
                      <button
                        type="button"
                        className="exam-cell"
                        data-state={answer.score === null ? "todo" : "done"}
                        aria-pressed={active}
                        aria-label={t("cellLabel", {
                          name: item.name,
                          task: titles.get(cell.task_id)?.title ?? "",
                        })}
                        onClick={() => open({ student: item.student_id, task: cell.task_id })}
                      >
                        {answer.score === null ? t("grade") : answer.score}
                      </button>
                    </td>
                  );
                })}
                <td className="tabular-nums">
                  {item.total !== null ? (
                    <span data-passed={item.passed ? "" : undefined} className="exam-total">
                      {item.total}%{item.final ? "" : "*"}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className="exam-cell"
                    data-state={item.extension_until ? "done" : undefined}
                    aria-pressed={selected?.student === item.student_id && selected.task === null}
                    aria-label={t("extendLabel", { name: item.name })}
                    onClick={() => open({ student: item.student_id, task: null })}
                  >
                    <CalendarClock aria-hidden className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t("totalHint")}</p>

      <div ref={panel} tabIndex={-1} className="exam-panel" aria-live="polite">
        {selected && row && selected.task !== null && (
          <GradePanel
            key={`${selected.student}-${selected.task}`}
            row={row}
            taskId={selected.task}
            title={titles.get(selected.task)?.title ?? ""}
            instructions={titles.get(selected.task)?.instructions ?? ""}
            onSaved={(next) => {
              setDetail(next);
              const upcoming = firstUngraded(next.rows);
              setSelected(upcoming);
            }}
          />
        )}
        {selected && row && selected.task === null && (
          <ExtensionPanel
            key={`ext-${selected.student}`}
            examId={detail.id}
            row={row}
            onSaved={setDetail}
          />
        )}
        {!selected && <p className="text-muted-foreground">{t("allGraded")}</p>}
      </div>
    </>
  );
}

function GradePanel({
  row,
  taskId,
  title,
  instructions,
  onSaved,
}: {
  row: Row;
  taskId: number;
  title: string;
  instructions: string;
  onSaved: (detail: Detail) => void;
}) {
  const t = useTranslations("TeacherExams");
  const ids = useId();
  const answer = row.tasks.find((cell) => cell.task_id === taskId)?.answer ?? null;
  const [score, setScore] = useState(answer?.score !== null ? String(answer?.score ?? "") : "");
  const [feedback, setFeedback] = useState(answer?.feedback ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!answer) return null;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!answer) return;
    const value = Number(score);
    if (score.trim() === "" || !Number.isInteger(value) || value < 0 || value > 100) {
      setError(t("errors.score"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data, error: failure } = await api.POST("/api/v1/teacher/exam-answers/{id}/grade/", {
        params: { path: { id: answer.id } },
        body: { score: value, feedback },
      });
      if (data) onSaved(data);
      else setError(problem(failure) ?? t("errors.server"));
    } catch {
      setError(t("errors.network"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="exam-grade">
      <div>
        <p className="text-sm text-muted-foreground">{row.name}</p>
        <h2 className="app-section-title">{title}</h2>
        <p className="exam-task__text mt-2">{instructions}</p>
      </div>
      <SubmissionView submission={answer} />
      <form className="rv-form" onSubmit={(event) => void save(event)} noValidate>
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
          />
        </div>
        <label className="hw-field">
          <span>{t("feedback")}</span>
          <textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            rows={4}
            maxLength={5000}
          />
        </label>
        {error && (
          <p role="alert" className="hw-error">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy} className="h-11 w-fit gap-2 rounded-full px-5">
          {busy ? <Loader2 aria-hidden className="animate-spin" /> : <Check aria-hidden />}
          {answer.score === null ? t("save") : t("update")}
        </Button>
      </form>
    </div>
  );
}

/** "05.10.2026 18:00" — faqat bosilgandan keyin (brauzerda) chiziladi, hydration xavfi yo'q. */
function short(value: string): string {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** `datetime-local` qiymati (mahalliy vaqt) — ertaga shu soat. */
function tomorrow(): string {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function ExtensionPanel({
  examId,
  row,
  onSaved,
}: {
  examId: number;
  row: Row;
  onSaved: (detail: Detail) => void;
}) {
  const t = useTranslations("TeacherExams");
  const ids = useId();
  const [until, setUntil] = useState(tomorrow);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const moment = new Date(until);
    if (Number.isNaN(moment.getTime())) {
      setError(t("errors.date"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data, error: failure } = await api.PUT("/api/v1/teacher/exams/{id}/extensions/", {
        params: { path: { id: examId } },
        body: { student: row.student_id, until: moment.toISOString() },
      });
      if (data) {
        onSaved(data);
        setSaved(true);
      } else setError(problem(failure) ?? t("errors.server"));
    } catch {
      setError(t("errors.network"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="rv-form" onSubmit={(event) => void save(event)} noValidate>
      <div>
        <p className="text-sm text-muted-foreground">{row.name}</p>
        <h2 className="app-section-title">{t("extensionTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("extensionHint")}</p>
        {row.extension_until && (
          <p className="mt-2 text-sm">
            {t("extensionCurrent", { date: short(row.extension_until) })}
          </p>
        )}
      </div>
      <div className="hw-field">
        <label htmlFor={`${ids}-until`}>{t("until")}</label>
        <input
          id={`${ids}-until`}
          type="datetime-local"
          value={until}
          onChange={(event) => {
            setUntil(event.target.value);
            setSaved(false);
          }}
          className="rv-score exam-until"
        />
      </div>
      {error && (
        <p role="alert" className="hw-error">
          {error}
        </p>
      )}
      <p role="status" className="text-sm text-muted-foreground">
        {saved ? t("extensionSaved") : ""}
      </p>
      <Button type="submit" disabled={busy} className="h-11 w-fit gap-2 rounded-full px-5">
        {busy ? <Loader2 aria-hidden className="animate-spin" /> : <CalendarClock aria-hidden />}
        {t("extend")}
      </Button>
    </form>
  );
}
