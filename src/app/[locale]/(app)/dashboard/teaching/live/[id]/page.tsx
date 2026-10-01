import { ArrowLeft, CalendarDays, MapPin, Video } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { JoinButton } from "@/features/live/join-button";
import { clock, dayLabel, timeRange } from "@/features/live/labels";
import { AttendanceSheet, CancelForm, CoverPanel, DetailsForm } from "@/features/live/teacher-live";
import { relativeDay } from "@/features/live/when";
import { notFoundMetadata } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import { getTeacherLive } from "@/lib/api/live";

function lessonId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/teaching/live/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const pk = lessonId(id);
  const lesson = pk ? await getTeacherLive(locale, pk) : null;
  if (!lesson) return notFoundMetadata(locale);
  const t = await getTranslations({ locale, namespace: "Schedule" });
  return { title: `${t("attendanceTitle")} · ${lesson.group}`, robots: { index: false } };
}

/**
 * O'qituvchining dars sahifasi: davomat (telefonda qulay), "Dars o'tildi", izoh va yozuv,
 * bekor qilish. Boshqa guruhning darsi — 404.
 */
export default async function TeacherLivePage({
  params,
}: PageProps<"/[locale]/dashboard/teaching/live/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const pk = lessonId(id);
  if (!pk) notFound();
  const [t, format, lesson] = await Promise.all([
    getTranslations("Schedule"),
    getFormatter(),
    getTeacherLive(locale, pk),
  ]);
  if (!lesson) notFound();

  const relative = relativeDay(lesson.starts_at);
  const joined = Object.fromEntries(
    lesson.students
      .filter((student) => student.joined_at)
      .map((student) => [student.id, clock(format, student.joined_at ?? "")]),
  );
  const online = lesson.kind === "ONLINE";

  return (
    <>
      <Link
        href={`/dashboard/teaching/${lesson.group_id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {lesson.group}
      </Link>

      <header className="mt-4">
        <p className="text-sm text-muted-foreground">{lesson.course_title}</p>
        <h1 className="app-title mt-1">{lesson.title || t("lessonTitle")}</h1>
        <ul className="teach-chips mt-4">
          <li className="teach-chip">
            <CalendarDays aria-hidden className="size-3.5" />
            {dayLabel(format, lesson.starts_at, relative ? t(relative) : null)},{" "}
            {timeRange(format, lesson.starts_at, lesson.ends_at)}
          </li>
          <li className="teach-chip">
            {online ? (
              <Video aria-hidden className="size-3.5" />
            ) : (
              <MapPin aria-hidden className="size-3.5" />
            )}
            {online ? t("online") : lesson.room ? t("room", { room: lesson.room }) : t("offline")}
          </li>
          {lesson.canceled && (
            <li className="teach-chip" data-status="CANCELED">
              {t("canceled")}
              {lesson.cancel_reason && ` — ${lesson.cancel_reason}`}
            </li>
          )}
        </ul>
        {lesson.join_url && !lesson.canceled && (
          <div className="mt-4">
            <JoinButton
              href={lesson.join_url}
              opensAt={lesson.opens_at}
              endsAt={lesson.ends_at}
              open={lesson.can_join}
              opensLabel={clock(format, lesson.opens_at)}
            />
          </div>
        )}
      </header>

      {!lesson.canceled && (
        <>
          <section aria-labelledby="attendance" className="app-card mt-8">
            <h2 id="attendance" className="app-section-title">
              {t("attendanceTitle")}
            </h2>
            <div className="mt-4">
              <AttendanceSheet
                lessonId={lesson.id}
                students={lesson.students}
                joined={joined}
                canMark={lesson.can_mark}
              />
            </div>
          </section>

          <section aria-labelledby="covered" className="app-card mt-6">
            <h2 id="covered" className="app-section-title">
              {t("coverTitle")}
            </h2>
            <div className="mt-3">
              <CoverPanel
                lessonId={lesson.id}
                lessons={lesson.course_lessons}
                topicId={lesson.topic_id}
                covered={lesson.covered}
                canUncover={lesson.can_uncover}
                canMark={lesson.can_mark}
              />
            </div>
          </section>

          <section aria-labelledby="details" className="app-card mt-6">
            <h2 id="details" className="app-section-title">
              {t("detailsTitle")}
            </h2>
            <div className="mt-4">
              <DetailsForm
                lessonId={lesson.id}
                notes={lesson.notes}
                recording={lesson.recording_url}
              />
            </div>
          </section>

          {lesson.can_cancel && (
            <section aria-labelledby="cancel" className="app-card mt-6">
              <h2 id="cancel" className="app-section-title">
                {t("cancelTitle")}
              </h2>
              <div className="mt-4">
                <CancelForm lessonId={lesson.id} />
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
