import { ArrowRight, CalendarDays, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { NamedIcon } from "@/features/landing/icons";
import { Link } from "@/i18n/navigation";
import { getTeacherExams } from "@/lib/api/exams";
import { getTeacherGroups, type TeacherGroup } from "@/lib/api/teacher";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/teaching">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Teaching" });
  return { title: t("title"), robots: { index: false } };
}

const statusKey = (status: TeacherGroup["status"]) => `status.${status}` as const;
const formatKey = (value: string) => `format.${value === "ONLINE" ? "ONLINE" : "OFFLINE"}` as const;

/** O'qituvchining guruhlari: holati, o'quvchilar soni va o'rtacha progress. */
export default async function TeachingPage({ params }: PageProps<"/[locale]/dashboard/teaching">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, e, format, groups, exams] = await Promise.all([
    getTranslations("Teaching"),
    getTranslations("TeacherExams"),
    getFormatter(),
    getTeacherGroups(locale),
    getTeacherExams(locale),
  ]);
  // O'qituvchi emas — bu bo'lim unga yo'q.
  if (groups === null) notFound();

  return (
    <>
      <header>
        <h1 className="app-title">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{t("intro")}</p>
      </header>

      {groups.length === 0 ? (
        <div className="app-empty mt-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-caret">
            <UsersRound aria-hidden className="size-6" />
          </span>
          <p className="max-w-lg text-pretty text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <ul className="teach-grid mt-8">
          {groups.map((group) => (
            <li key={group.id}>
              <article className="teach-card" aria-labelledby={`group-${group.id}`}>
                <div className="flex items-start gap-3">
                  <span aria-hidden className="course-tile__icon">
                    <NamedIcon name={group.course_icon} className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-muted-foreground">{group.course_title}</p>
                    <h2 id={`group-${group.id}`} className="teach-card__name">
                      <Link href={`/dashboard/teaching/${group.id}`} className="teach-card__link">
                        {group.name}
                      </Link>
                    </h2>
                  </div>
                </div>

                <ul className="teach-chips">
                  <li className="teach-chip" data-status={group.status}>
                    {t(statusKey(group.status))}
                  </li>
                  <li className="teach-chip">{t(formatKey(group.study_format))}</li>
                </ul>

                <div className="teach-card__meta">
                  {group.schedule && (
                    <p className="flex items-center gap-2">
                      <CalendarDays aria-hidden className="size-4 shrink-0" />
                      {group.schedule}
                    </p>
                  )}
                  {group.starts_on && (
                    <p>
                      {t("startsOn", {
                        date: format.dateTime(new Date(group.starts_on), {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }),
                      })}
                    </p>
                  )}
                </div>

                <div className="mt-auto">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span>{t("students", { count: group.students_count })}</span>
                    <span className="text-muted-foreground">
                      {t("average")}:{" "}
                      <strong className="text-foreground tabular-nums">
                        {group.average_percent}%
                      </strong>
                    </span>
                  </div>
                  <div className="progress-track mt-2" role="presentation">
                    <span style={{ width: `${group.average_percent}%` }} />
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {exams && exams.length > 0 && (
        <section aria-labelledby="teacher-exams" className="mt-12">
          <h2 id="teacher-exams" className="app-section-title">
            {e("listTitle")}
          </h2>
          <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">{e("listIntro")}</p>
          <ul className="exam-list mt-5">
            {exams.map((exam) => (
              <li key={exam.id}>
                <article className="exam-card" aria-labelledby={`teacher-exam-${exam.id}`}>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">
                      {format.dateTime(new Date(exam.month), { month: "long", year: "numeric" })}
                    </p>
                    <h3 id={`teacher-exam-${exam.id}`} className="exam-card__title">
                      <Link
                        href={`/dashboard/teaching/exams/${exam.id}`}
                        className="teach-card__link"
                      >
                        {exam.course_title}
                      </Link>
                    </h3>
                    <ul className="teach-chips mt-3">
                      <li className="exam-chip" data-state={exam.status}>
                        {e(exam.status === "DRAFT" ? "draft" : "ready")}
                      </li>
                      <li className="teach-chip">
                        {e("testedCount", { tested: exam.tested, students: exam.students })}
                      </li>
                      {exam.to_grade > 0 && (
                        <li className="exam-chip" data-state="todo">
                          {e("toGradeCount", { count: exam.to_grade })}
                        </li>
                      )}
                    </ul>
                  </div>
                  <ArrowRight aria-hidden className="exam-card__arrow size-5" />
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
