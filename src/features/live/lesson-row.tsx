import { ClipboardCheck, MapPin, PlayCircle, Video } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { LiveLesson } from "@/lib/api/live";

import { JoinButton } from "./join-button";

/**
 * Jadvaldagi bitta dars: vaqt, mavzu, guruh, qayerda, holat va amallar. Sanalar serverda
 * formatlanib keladi (brauzerlarda o'zbekcha oy nomlari yo'q).
 */
export async function LessonRow({
  lesson,
  time,
  opensLabel,
}: {
  lesson: LiveLesson;
  /** "18:00–19:30" */
  time: string;
  /** "17:45" */
  opensLabel: string;
}) {
  const t = await getTranslations("Schedule");
  const online = lesson.kind === "ONLINE";

  return (
    <li className="live-row" data-canceled={lesson.canceled ? "" : undefined}>
      <p className="live-row__time">{time}</p>
      <div className="live-row__body">
        <p className="live-row__title">{lesson.title || lesson.group}</p>
        <p className="live-row__meta">
          {lesson.group} · {lesson.course_title}
        </p>
        <p className="live-row__place">
          {online ? (
            <Video aria-hidden className="size-3.5" />
          ) : (
            <MapPin aria-hidden className="size-3.5" />
          )}
          {online ? t("online") : lesson.room ? t("room", { room: lesson.room }) : t("offline")}
        </p>
        {lesson.canceled && (
          <p className="live-row__canceled">
            {t("canceled")}
            {lesson.cancel_reason && ` — ${lesson.cancel_reason}`}
          </p>
        )}
        {lesson.notes && (
          <p className="live-row__notes">
            <span className="sr-only">{t("notes")}: </span>
            {lesson.notes}
          </p>
        )}
      </div>
      <div className="live-row__actions">
        {lesson.attendance && (
          <span className="live-status" data-status={lesson.attendance}>
            {t(`attendance.${lesson.attendance}`)}
          </span>
        )}
        {lesson.join_url && !lesson.canceled && (
          <JoinButton
            href={lesson.join_url}
            opensAt={lesson.opens_at}
            endsAt={lesson.ends_at}
            open={lesson.can_join}
            opensLabel={opensLabel}
          />
        )}
        {lesson.recording_url && (
          <a
            href={lesson.recording_url}
            target="_blank"
            rel="noopener noreferrer"
            className="live-link"
          >
            <PlayCircle aria-hidden className="size-4" />
            {t("recording")}
          </a>
        )}
        {lesson.is_teacher && !lesson.canceled && (
          <Link href={`/dashboard/teaching/live/${lesson.id}`} className="live-link">
            <ClipboardCheck aria-hidden className="size-4" />
            {t("openAttendance")}
          </Link>
        )}
      </div>
    </li>
  );
}
