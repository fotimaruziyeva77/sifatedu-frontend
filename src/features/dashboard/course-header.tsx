import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  Clock,
  Crown,
  Infinity as Forever,
} from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { NamedIcon } from "@/features/landing/icons";
import { Link } from "@/i18n/navigation";
import type { MyCourseDetail } from "@/lib/api/learning";
import { cn } from "@/lib/utils";

const RING = 2 * Math.PI * 42;

/** Aylana ko'rinishidagi progress: foiz matn bilan ham yoziladi (faqat rangga tayanmaydi). */
function ProgressRing({ percent, label }: { percent: number; label: string }) {
  return (
    <div className="course-ring" role="img" aria-label={label}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="42" className="course-ring__track" />
        <circle
          cx="50"
          cy="50"
          r="42"
          className="course-ring__value"
          strokeDasharray={RING}
          strokeDashoffset={RING * (1 - percent / 100)}
        />
      </svg>
      <span className="course-ring__label">{percent}%</span>
    </div>
  );
}

/**
 * Kabinetdagi kurs sarlavhasi. To'lab olingan kurs — "premium": boy fon, belgi va imtiyozlar;
 * sotib olingan narsaning qadri ko'rinib turishi kerak.
 */
export async function CourseHeader({ course }: { course: MyCourseDetail }) {
  const [t, format] = await Promise.all([getTranslations("Dashboard"), getFormatter()]);
  const hours = Math.max(1, Math.round(course.total_duration_min / 60));
  const next = course.next_lesson_id;
  const finished = course.lesson_count > 0 && course.completed_count >= course.lesson_count;

  return (
    <header className={cn("course-head", course.is_premium && "is-premium")}>
      <div className="course-head__main">
        <div className="flex flex-wrap items-center gap-2">
          {course.is_premium && (
            <span className="course-head__badge">
              <Crown aria-hidden className="size-4" />
              {t("premium")}
            </span>
          )}
          <span className="course-head__chip">
            {course.study_format === "OFFLINE" ? t("formatOffline") : t("formatOnline")}
          </span>
        </div>

        <div className="mt-4 flex items-start gap-4">
          <span aria-hidden className="course-head__icon">
            <NamedIcon name={course.icon} className="size-7" />
          </span>
          <h1 className="app-title">{course.title}</h1>
        </div>

        <ul className="course-head__facts">
          <li>
            <BookOpen aria-hidden className="size-4" />
            {t("lessonsCount", { done: course.completed_count, total: course.lesson_count })}
          </li>
          <li>
            <Clock aria-hidden className="size-4" />
            {t("hoursTotal", { count: hours })}
          </li>
          <li>
            {course.expires_at ? (
              <>
                <CalendarClock aria-hidden className="size-4" />
                {t("expiresAt", {
                  date: format.dateTime(new Date(course.expires_at), {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }),
                })}
              </>
            ) : (
              <>
                <Forever aria-hidden className="size-4" />
                {t("lifetime")}
              </>
            )}
          </li>
        </ul>

        {next && (
          <Button asChild className="mt-6 h-12 gap-2 rounded-full px-6 text-base">
            <Link href={`/dashboard/courses/${course.slug}/lessons/${next}`}>
              {finished
                ? t("openCourse")
                : course.completed_count > 0
                  ? t("continueCourse")
                  : t("startCourse")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        )}
      </div>

      <ProgressRing
        percent={course.percent}
        label={t("progressLabel", { value: course.percent })}
      />
    </header>
  );
}
