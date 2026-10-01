import { ArrowRight, Trophy } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getMyExams, type ExamCard } from "@/lib/api/exams";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/exams">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Exams" });
  return { title: t("title"), robots: { index: false } };
}

/** Test qismi holati: boshlanmagan, davom etmoqda yoki natija. */
function testLine(exam: ExamCard, t: Awaited<ReturnType<typeof getTranslations<"Exams">>>) {
  if (exam.test.finished) return t("card.testScore", { score: exam.test.score ?? 0 });
  if (exam.test.started) return t("card.testRunning");
  return t("card.testNotStarted");
}

/** Oylik imtihonlar: ochiqlari tepada, yopilganlarida — natija. */
export default async function ExamsPage({ params }: PageProps<"/[locale]/dashboard/exams">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, format, exams] = await Promise.all([
    getTranslations("Exams"),
    getFormatter(),
    getMyExams(locale),
  ]);
  const day = (value: string) =>
    format.dateTime(new Date(value), { day: "numeric", month: "long" });
  const lastDay = (value: string) =>
    day(new Date(new Date(value).getTime() - 60_000).toISOString());

  return (
    <>
      <header>
        <h1 className="app-title">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{t("intro")}</p>
      </header>

      {exams.length === 0 ? (
        <div className="app-empty mt-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-caret">
            <Trophy aria-hidden className="size-6" />
          </span>
          <p className="max-w-lg text-pretty text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <ul className="exam-list mt-8">
          {exams.map((exam) => (
            <li key={exam.id}>
              <article className="exam-card" aria-labelledby={`exam-${exam.id}`}>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">
                    {t("period", { from: day(exam.opens_at), to: lastDay(exam.closes_at) })}
                  </p>
                  <h2 id={`exam-${exam.id}`} className="exam-card__title">
                    <Link href={`/dashboard/exams/${exam.id}`} className="teach-card__link">
                      {exam.course_title}
                    </Link>
                  </h2>
                  <ul className="teach-chips mt-3">
                    <li className="exam-chip" data-state={exam.state}>
                      {t(`state.${exam.state}`)}
                    </li>
                    {exam.result?.final ? (
                      <li
                        className="exam-chip"
                        data-state={exam.result.passed ? "passed" : "failed"}
                      >
                        {t(exam.result.passed ? "card.passed" : "card.failed", {
                          total: exam.result.total,
                        })}
                      </li>
                    ) : (
                      <>
                        <li className="teach-chip">{testLine(exam, t)}</li>
                        {exam.tasks_total > 0 && (
                          <li className="teach-chip">
                            {t("card.tasks", {
                              done: exam.tasks_submitted,
                              total: exam.tasks_total,
                            })}
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                </div>
                <ArrowRight aria-hidden className="exam-card__arrow size-5" />
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
