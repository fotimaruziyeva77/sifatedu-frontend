import { ArrowLeft, CalendarDays, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { TeacherDailySection } from "@/features/daily-test/teacher-daily";
import { PenaltyList } from "@/features/rewards/penalty-list";
import { notFoundMetadata } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import { getTeacherDaily } from "@/lib/api/daily-test";
import { getPenalties } from "@/lib/api/rewards";
import { getTeacherGroup, type TeacherGroup } from "@/lib/api/teacher";
import { initials } from "@/lib/format";

function groupId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/teaching/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const pk = groupId(id);
  const group = pk ? await getTeacherGroup(locale, pk) : null;
  if (!group) return notFoundMetadata(locale);
  return { title: `${group.name} · ${group.course_title}`, robots: { index: false } };
}

const statusKey = (status: TeacherGroup["status"]) => `status.${status}` as const;
const formatKey = (value: string) => `format.${value === "ONLINE" ? "ONLINE" : "OFFLINE"}` as const;

/**
 * Guruh sahifasi: o'quvchilar va ularning progressi. Orqada qolganlar tepada — o'qituvchi
 * kimga yordam kerakligini birinchi ko'radi (backend shu tartibda beradi).
 */
export default async function TeachingGroupPage({
  params,
  searchParams,
}: PageProps<"/[locale]/dashboard/teaching/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const pk = groupId(id);
  if (!pk) notFound();
  const query = await searchParams;
  const raw = Array.isArray(query.daily) ? query.daily[0] : query.daily;
  const dailyDay = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;
  const [t, tRewards, format, group, penalties, daily] = await Promise.all([
    getTranslations("Teaching"),
    getTranslations("Rewards"),
    getFormatter(),
    getTeacherGroup(locale, pk),
    getPenalties(locale, pk),
    getTeacherDaily(locale, pk, dailyDay),
  ]);
  if (!group) notFound();

  return (
    <>
      <Link
        href="/dashboard/teaching"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {t("back")}
      </Link>

      <header className="mt-4">
        <p className="text-sm text-muted-foreground">{group.course_title}</p>
        <h1 className="app-title mt-1">{group.name}</h1>
        <ul className="teach-chips mt-4">
          <li className="teach-chip" data-status={group.status}>
            {t(statusKey(group.status))}
          </li>
          <li className="teach-chip">{t(formatKey(group.study_format))}</li>
          {group.schedule && (
            <li className="teach-chip">
              <CalendarDays aria-hidden className="size-3.5" />
              {group.schedule}
            </li>
          )}
          <li className="teach-chip">{t("students", { count: group.students_count })}</li>
          <li className="teach-chip">
            {t("average")}: {group.average_percent}%
          </li>
        </ul>
      </header>

      <section aria-labelledby="students" className="app-card mt-8">
        <h2 id="students" className="app-section-title">
          {t("groupStudents")}
        </h2>

        {group.students.length === 0 ? (
          <p className="mt-3 text-muted-foreground">{t("noStudents")}</p>
        ) : (
          <div className="teach-table-wrap mt-4">
            {/* Telefonda qatorlar kartochkaga aylanadi: rollar jadval semantikasini saqlaydi. */}
            <table role="table" className="teach-table">
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader" scope="col">
                    {t("student")}
                  </th>
                  <th role="columnheader" scope="col">
                    {t("progress")}
                  </th>
                  <th role="columnheader" scope="col">
                    {t("homework")}
                  </th>
                  <th role="columnheader" scope="col">
                    {t("quizzes")}
                  </th>
                  <th role="columnheader" scope="col">
                    {t("attendance")}
                  </th>
                  <th role="columnheader" scope="col">
                    {t("lastActivity")}
                  </th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {group.students.map((student) => (
                  <tr key={student.id} role="row">
                    <th role="rowheader" scope="row">
                      <div className="flex items-center gap-3">
                        <span aria-hidden className="teach-avatar">
                          {initials(student.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium">{student.name}</p>
                          <a
                            href={`tel:${student.phone}`}
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                            aria-label={t("call", { name: student.name })}
                          >
                            <Phone aria-hidden className="size-3.5" />
                            {student.phone}
                          </a>
                          {(student.inactive || !student.active) && (
                            <p className="mt-1 flex flex-wrap gap-1.5">
                              {student.inactive && (
                                <span className="teach-flag">{t("inactive")}</span>
                              )}
                              {!student.active && (
                                <span className="teach-flag">{t("accessClosed")}</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </th>
                    <td role="cell">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">
                          {t("lessons", { done: student.completed, total: student.total })}
                        </span>
                        <strong className="tabular-nums">{student.percent}%</strong>
                      </div>
                      <div className="progress-track mt-1.5" role="presentation">
                        <span style={{ width: `${student.percent}%` }} />
                      </div>
                    </td>
                    <td role="cell" className="text-sm" data-label={t("homework")}>
                      {student.homework_accepted > 0 || student.homework_pending > 0 ? (
                        <span className="flex flex-wrap items-center gap-1.5">
                          {t("homeworkAccepted", { count: student.homework_accepted })}
                          {student.homework_average !== null && (
                            <span className="text-muted-foreground">
                              · {t("homeworkAverage", { score: student.homework_average })}
                            </span>
                          )}
                          {student.homework_pending > 0 && (
                            <Link href="/dashboard/reviews" className="teach-flag">
                              {t("homeworkPending", { count: student.homework_pending })}
                            </Link>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td role="cell" className="text-sm" data-label={t("quizzes")}>
                      {student.quiz_average !== null ? (
                        <span className="flex flex-wrap items-center gap-1.5">
                          {t("quizPassed", { count: student.quiz_passed })}
                          <span className="text-muted-foreground">
                            · {t("quizAverage", { score: student.quiz_average })}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td role="cell" className="text-sm" data-label={t("attendance")}>
                      {student.attendance_rate !== null ? (
                        <strong className="tabular-nums">{student.attendance_rate}%</strong>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td role="cell" className="text-sm" data-label={t("lastActivity")}>
                      {student.last_activity
                        ? format.dateTime(new Date(student.last_activity), {
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : t("never")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {daily && <TeacherDailySection groupId={pk} data={daily} />}

      <section aria-labelledby="live" className="app-card mt-6">
        <h2 id="live" className="app-section-title">
          {t("liveLessons")}
        </h2>
        {group.lessons.length === 0 ? (
          <p className="mt-3 text-muted-foreground">{t("liveEmpty")}</p>
        ) : (
          <ul className="live-mini mt-4">
            {group.lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link href={`/dashboard/teaching/live/${lesson.id}`} className="live-mini__row">
                  <span className="live-mini__when">
                    {format.dateTime(new Date(lesson.starts_at), {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {lesson.title || t("liveUntitled")}
                  </span>
                  <span className="live-mini__state">
                    {lesson.canceled
                      ? t("liveCanceled")
                      : lesson.marked > 0
                        ? t("liveCame", { came: lesson.came, marked: lesson.marked })
                        : t("liveNotMarked")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="penalties" className="app-card mt-6">
        <h2 id="penalties" className="app-section-title">
          {tRewards("penaltiesTitle")}
        </h2>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">
          {tRewards("penaltiesHint")}
        </p>
        <div className="mt-4">
          <PenaltyList initial={penalties} />
        </div>
      </section>
    </>
  );
}
