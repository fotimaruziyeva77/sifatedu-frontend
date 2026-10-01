import { ArrowLeft, ExternalLink, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { ExamGrading } from "@/features/exams/exam-grading";
import { notFoundMetadata } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import { getTeacherExam } from "@/lib/api/exams";

function examId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/teaching/exams/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const pk = examId(id);
  const exam = pk ? await getTeacherExam(locale, pk) : null;
  if (!exam) return notFoundMetadata(locale);
  const t = await getTranslations({ locale, namespace: "TeacherExams" });
  return { title: `${t("eyebrow")} · ${exam.course_title}`, robots: { index: false } };
}

/**
 * O'qituvchi: oylik imtihon natijalari va amaliy javoblarni baholash. Qoralama bo'lsa —
 * admin panelda tayyorlash haqida eslatma (topshiriqlar va savol modullari).
 */
export default async function TeacherExamPage({
  params,
}: PageProps<"/[locale]/dashboard/teaching/exams/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const pk = examId(id);
  if (!pk) notFound();
  const [t, format, exam] = await Promise.all([
    getTranslations("TeacherExams"),
    getFormatter(),
    getTeacherExam(locale, pk),
  ]);
  if (!exam) notFound();
  const day = (value: string) =>
    format.dateTime(new Date(value), { day: "numeric", month: "long" });
  const month = format.dateTime(new Date(exam.month), { month: "long", year: "numeric" });
  const lastDay = day(new Date(new Date(exam.closes_at).getTime() - 60_000).toISOString());
  const draft = exam.status === "DRAFT";

  return (
    <div className="exam-page exam-page--wide">
      <Link
        href="/dashboard/teaching"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {t("back")}
      </Link>

      <header className="mt-4">
        <p className="text-sm text-muted-foreground">
          {t("eyebrow")} · {month}
        </p>
        <h1 className="app-title mt-1">{exam.course_title}</h1>
        <ul className="teach-chips mt-4">
          <li className="exam-chip" data-state={draft ? "DRAFT" : "READY"}>
            {t(draft ? "draft" : "ready")}
          </li>
          <li className="teach-chip">{t("period", { from: day(exam.opens_at), to: lastDay })}</li>
          <li className="teach-chip">{t("passMark", { percent: exam.pass_percent })}</li>
          <li className="teach-chip">{t("weights", { test: exam.test_weight })}</li>
        </ul>
      </header>

      {draft && (
        <div className="exam-draft" role="note">
          <TriangleAlert aria-hidden className="size-5 shrink-0" />
          <div>
            <p className="font-medium">{t("draftTitle")}</p>
            <p className="mt-1 text-sm">{t("draftText")}</p>
            {/* Admin panel — Next.js ilovasidan tashqarida (Django), oddiy havola. */}
            <a href={`/admin/exams/exam/${exam.id}/change/`} className="exam-draft__link">
              {t("draftAction")}
              <ExternalLink aria-hidden className="size-4" />
            </a>
          </div>
        </div>
      )}

      <dl className="exam-stats">
        <div>
          <dt>{t("students")}</dt>
          <dd>{exam.students}</dd>
        </div>
        <div>
          <dt>{t("tested")}</dt>
          <dd>{exam.tested}</dd>
        </div>
        <div>
          <dt>{t("toGrade")}</dt>
          <dd data-attention={exam.to_grade > 0 ? "" : undefined}>{exam.to_grade}</dd>
        </div>
      </dl>

      {exam.tasks.length > 0 && (
        <details className="exam-review mt-6">
          <summary>{t("tasksTitle", { count: exam.tasks.length })}</summary>
          <ol className="exam-task-list">
            {exam.tasks.map((task) => (
              <li key={task.id}>
                <p className="font-medium">{task.title}</p>
                <p className="exam-task__text">{task.instructions}</p>
              </li>
            ))}
          </ol>
        </details>
      )}

      <section aria-labelledby="exam-rows" className="mt-8">
        <h2 id="exam-rows" className="app-section-title">
          {t("resultsTitle")}
        </h2>
        {exam.rows.length === 0 ? (
          <p className="mt-3 text-muted-foreground">{t("noStudents")}</p>
        ) : (
          <div className="mt-4">
            <ExamGrading initial={exam} />
          </div>
        )}
      </section>
    </div>
  );
}
