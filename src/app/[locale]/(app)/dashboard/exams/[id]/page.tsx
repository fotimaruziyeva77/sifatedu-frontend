import { ArrowLeft, ClipboardList, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { ExamResult } from "@/features/exams/exam-result";
import { ExamReview } from "@/features/exams/exam-review";
import { ExamTasks, type TaskDates } from "@/features/exams/exam-tasks";
import { ExamTest } from "@/features/exams/exam-test";
import { notFoundMetadata } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import { getExam } from "@/lib/api/exams";

function examId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/exams/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const pk = examId(id);
  const exam = pk ? await getExam(locale, pk) : null;
  if (!exam) return notFoundMetadata(locale);
  const t = await getTranslations({ locale, namespace: "Exams" });
  return { title: `${t("eyebrow")} · ${exam.course_title}`, robots: { index: false } };
}

/**
 * Oylik imtihon: natija, test qismi (vaqtli, bitta urinish) va amaliy topshiriqlar. Imtihon
 * yopilgach — testdagi to'g'ri javoblar va izohlar.
 */
export default async function ExamPage({ params }: PageProps<"/[locale]/dashboard/exams/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const pk = examId(id);
  if (!pk) notFound();
  const [t, format, exam] = await Promise.all([
    getTranslations("Exams"),
    getFormatter(),
    getExam(locale, pk),
  ]);
  if (!exam) notFound();
  // Sanalar serverda formatlanadi: brauzerlarda o'zbekcha oy nomlari yo'q.
  const day = (value: string) =>
    format.dateTime(new Date(value), { day: "numeric", month: "long" });
  const when = (value: string) =>
    format.dateTime(new Date(value), {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  // Yopilish vaqti — keyingi kun 00:00; o'quvchiga oxirgi kun ko'rsatiladi.
  const lastDay = day(new Date(new Date(exam.closes_at).getTime() - 60_000).toISOString());
  const dates: TaskDates = Object.fromEntries(
    exam.tasks
      .filter((task) => task.answer)
      .map((task) => [
        task.id,
        {
          updated: when(task.answer?.updated_at ?? exam.opens_at),
          reviewed: task.answer?.reviewed_at ? when(task.answer.reviewed_at) : null,
        },
      ]),
  );
  const open = exam.state === "OPEN";

  return (
    <div className="exam-page">
      <Link
        href="/dashboard/exams"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {t("title")}
      </Link>

      <header className="mt-4">
        <p className="text-sm text-muted-foreground">{t("eyebrow")}</p>
        <h1 className="app-title mt-1">{exam.course_title}</h1>
        <ul className="teach-chips mt-4">
          <li className="exam-chip" data-state={exam.state}>
            {t(`state.${exam.state}`)}
          </li>
          <li className="teach-chip">{t("period", { from: day(exam.opens_at), to: lastDay })}</li>
          <li className="teach-chip">{t("passMark", { percent: exam.pass_percent })}</li>
        </ul>
        {open && <p className="exam-deadline">{t("deadline", { date: when(exam.closes_at) })}</p>}
      </header>

      {exam.result && <ExamResult result={exam.result} passPercent={exam.pass_percent} />}

      <section aria-labelledby="exam-test" className="quiz exam-part">
        <header className="exam-part__head">
          <span aria-hidden className="quiz-head__icon">
            <ListChecks className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {t("partWeight", { percent: exam.test_weight })}
            </p>
            <h2 id="exam-test" className="app-section-title">
              {t("testTitle")}
            </h2>
          </div>
        </header>
        <ExamTest examId={exam.id} test={exam.test} canTake={exam.can_take} />
        {exam.test.review.length > 0 && <ExamReview test={exam.test} />}
      </section>

      {exam.tasks.length > 0 && (
        <section aria-labelledby="exam-tasks" className="quiz exam-part">
          <header className="exam-part__head">
            <span aria-hidden className="quiz-head__icon">
              <ClipboardList className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                {t("partWeight", { percent: 100 - exam.test_weight })}
              </p>
              <h2 id="exam-tasks" className="app-section-title">
                {t("tasksTitle", { done: exam.tasks_submitted, total: exam.tasks_total })}
              </h2>
            </div>
          </header>
          {exam.can_take && <p className="exam-note">{t("tasksHint")}</p>}
          <ExamTasks tasks={exam.tasks} canAnswer={exam.can_take} dates={dates} />
        </section>
      )}
    </div>
  );
}
