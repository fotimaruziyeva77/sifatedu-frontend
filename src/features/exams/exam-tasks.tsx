"use client";

import { CheckCircle2, Hourglass } from "lucide-react";
import { useTranslations } from "next-intl";

import { AnswerForm } from "@/features/homework/homework-panel";
import { SubmissionView } from "@/features/homework/submission-view";
import type { components } from "@/lib/api/schema";

type Task = components["schemas"]["ExamTask"];

/** Serverda formatlangan sanalar (brauzerlarda o'zbekcha oy nomlari yo'q). */
export type TaskDates = Record<number, { updated: string; reviewed: string | null }>;

/**
 * Amaliy topshiriqlar: shart, javob (izoh, kod, havola, fayllar) va baho. Imtihon ochiq va
 * baholanmagan bo'lsa javobni yangilash mumkin; yuborilgach sahifa serverdan yangilanadi.
 */
export function ExamTasks({
  tasks,
  canAnswer,
  dates,
}: {
  tasks: Task[];
  canAnswer: boolean;
  dates: TaskDates;
}) {
  const t = useTranslations("Exams");
  const firstOpen = tasks.find((task) => !task.answer)?.id;

  return (
    <ol className="exam-tasks">
      {tasks.map((task, position) => {
        const answer = task.answer;
        const graded = answer?.score !== null && answer?.score !== undefined;
        const state = graded ? "graded" : answer ? "submitted" : "empty";
        return (
          <li key={task.id} className="exam-task" aria-labelledby={`task-${task.id}`}>
            <header className="exam-task__head">
              <span aria-hidden className="exam-task__number">
                {position + 1}
              </span>
              <h3 id={`task-${task.id}`} className="exam-task__title">
                {task.title}
              </h3>
              <span className="exam-chip" data-state={state}>
                {graded ? t("taskScore", { score: answer?.score ?? 0 }) : t(`taskState.${state}`)}
              </span>
            </header>
            <p className="exam-task__text">{task.instructions}</p>

            {answer && (
              <div className="exam-task__answer">
                <p className="exam-task__meta">
                  {t("answerSent", { date: dates[task.id]?.updated ?? "" })}
                </p>
                <SubmissionView submission={answer} />
                {graded ? (
                  <div className="hw-review" data-status="ACCEPTED">
                    <p className="hw-review__title">
                      <CheckCircle2 aria-hidden className="size-5" />
                      {t("gradedTitle", { score: answer.score ?? 0 })}
                    </p>
                    {answer.feedback && <p className="hw-review__text">{answer.feedback}</p>}
                    <p className="hw-review__meta">
                      {answer.reviewer_name}
                      {dates[task.id]?.reviewed ? ` · ${dates[task.id]?.reviewed}` : ""}
                    </p>
                  </div>
                ) : (
                  <p className="exam-task__wait">
                    <Hourglass aria-hidden className="size-4" />
                    {t("waitGrade")}
                  </p>
                )}
              </div>
            )}

            {canAnswer &&
              !graded &&
              (answer ? (
                <details className="exam-task__update">
                  <summary>{t("updateAnswer")}</summary>
                  <AnswerForm
                    action={`/api/v1/exam-tasks/${task.id}/answer/`}
                    again
                    title={t("newAnswer")}
                  />
                </details>
              ) : (
                // Besh topshiriqda hamma forma ochiq tursa sahifa juda uzun: birinchisi ochiq.
                <details className="exam-task__update" open={task.id === firstOpen}>
                  <summary>{t("writeAnswer")}</summary>
                  <AnswerForm action={`/api/v1/exam-tasks/${task.id}/answer/`} again={false} />
                </details>
              ))}
          </li>
        );
      })}
    </ol>
  );
}
