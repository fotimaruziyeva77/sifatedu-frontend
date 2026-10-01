import { ArrowRight, CalendarDays } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { LiveLesson } from "@/lib/api/live";

import { JoinButton } from "./join-button";
import { clock, dayLabel, timeRange } from "./labels";
import { relativeDay } from "./when";

/** Bosh sahifada: eng yaqin (bekor qilinmagan) jonli dars va bir bosishda qo'shilish. */
export async function NextLive({ lesson }: { lesson: LiveLesson }) {
  const [t, format] = await Promise.all([getTranslations("Schedule"), getFormatter()]);
  const relative = relativeDay(lesson.starts_at);
  const place =
    lesson.kind === "ONLINE"
      ? t("online")
      : lesson.room
        ? t("room", { room: lesson.room })
        : t("offline");

  return (
    <section aria-labelledby="next-live" className="app-card live-next mt-8">
      <h2 id="next-live" className="app-section-title flex items-center gap-2">
        <CalendarDays aria-hidden className="size-5 text-caret" />
        {t("nextTitle")}
      </h2>
      <p className="live-next__when">
        {dayLabel(format, lesson.starts_at, relative ? t(relative) : null)},{" "}
        {timeRange(format, lesson.starts_at, lesson.ends_at)}
      </p>
      <p className="mt-1 font-medium">{lesson.title || lesson.group}</p>
      <p className="text-sm text-muted-foreground">
        {lesson.group} · {lesson.course_title} · {place}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {lesson.join_url && (
          <JoinButton
            href={lesson.join_url}
            opensAt={lesson.opens_at}
            endsAt={lesson.ends_at}
            open={lesson.can_join}
            opensLabel={clock(format, lesson.opens_at)}
            size="large"
          />
        )}
        <Link href="/dashboard/schedule" className="live-link">
          {t("allSchedule")}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </section>
  );
}
