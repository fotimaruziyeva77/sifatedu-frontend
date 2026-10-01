import { ArrowRight, Check, Crown, Star } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { NamedIcon } from "@/features/landing/icons";
import { Link } from "@/i18n/navigation";
import type { MyCourse } from "@/lib/api/learning";
import { cn } from "@/lib/utils";

import type { Audience } from "./nav";

/** Yulduzlar soni: bolalar uchun progress shu bilan ko'rsatiladi. */
const STARS = 5;

/**
 * Kabinetdagi kurs kartochkasi. Bolalar ko'rinishida progress yulduzlar bilan,
 * kattalar ko'rinishida chiziq va foiz bilan beriladi.
 */
export async function CourseTile({ course, audience }: { course: MyCourse; audience: Audience }) {
  const [t, format] = await Promise.all([getTranslations("Dashboard"), getFormatter()]);
  const done = course.completed_count >= course.lesson_count && course.lesson_count > 0;
  const started = course.completed_count > 0;
  const target = course.next_lesson_id
    ? `/dashboard/courses/${course.slug}/lessons/${course.next_lesson_id}`
    : `/dashboard/courses/${course.slug}`;

  return (
    <article className={cn("course-tile", course.is_premium && "is-premium")}>
      {course.is_premium && (
        <span className="course-tile__badge">
          <Crown aria-hidden className="size-3.5" />
          {t("premium")}
        </span>
      )}
      <div className={cn("flex items-start gap-3", course.is_premium && "pr-24")}>
        <span aria-hidden className="course-tile__icon">
          <NamedIcon name={course.icon} className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="course-tile__name text-pretty">{course.title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("lessonsCount", { done: course.completed_count, total: course.lesson_count })}
          </p>
        </div>
      </div>

      {audience === "KIDS" ? (
        <Stars percent={course.percent} label={t("kidsStars", { done: course.completed_count })} />
      ) : (
        <Progress percent={course.percent} />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild className="h-10 gap-2 rounded-full px-4">
          <Link href={target}>
            {done ? t("openCourse") : started ? t("continueCourse") : t("startCourse")}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </Button>
        {done && (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Check aria-hidden className="size-4 text-caret" />
            {t("allDone")}
          </span>
        )}
        {course.expires_at && (
          <span className="text-sm text-muted-foreground">
            {t("expiresAt", {
              date: format.dateTime(new Date(course.expires_at), {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            })}
          </span>
        )}
      </div>
    </article>
  );
}

function Progress({ percent }: { percent: number }) {
  return (
    <div>
      <div className="progress-track" role="presentation">
        <span style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1.5 text-sm font-medium tabular-nums">{percent}%</p>
    </div>
  );
}

function Stars({ percent, label }: { percent: number; label: string }) {
  const filled = Math.round((percent / 100) * STARS);
  return (
    <div>
      <div className="kids-stars" role="img" aria-label={label}>
        {Array.from({ length: STARS }, (_, index) => (
          <Star key={index} aria-hidden data-on={index < filled ? "" : undefined} />
        ))}
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
