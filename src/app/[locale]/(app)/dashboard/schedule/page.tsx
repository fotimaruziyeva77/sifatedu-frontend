import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { dayLabel, clock, timeRange } from "@/features/live/labels";
import { LessonRow } from "@/features/live/lesson-row";
import { byDay, relativeDay } from "@/features/live/when";
import { getSchedule } from "@/lib/api/live";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/schedule">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Schedule" });
  return { title: t("title"), robots: { index: false } };
}

/**
 * Jadval: guruhning yaqin 14 kunlik darslari (kunlar bo'yicha) va oxirgi 30 kunlik o'tgan
 * darslar — davomat holati, izoh va yozuv bilan. O'qituvchiga — o'z guruhlari, davomat havolasi.
 */
export default async function SchedulePage({
  params,
  searchParams,
}: PageProps<"/[locale]/dashboard/schedule">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { closed } = await searchParams;
  const [t, format, upcoming, past] = await Promise.all([
    getTranslations("Schedule"),
    getFormatter(),
    getSchedule(locale, "upcoming"),
    getSchedule(locale, "past"),
  ]);
  const now = new Date();
  const title = (value: string) => {
    const relative = relativeDay(value, now);
    return dayLabel(format, value, relative ? t(relative) : null);
  };

  return (
    <>
      <header>
        <h1 className="app-title">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{t("intro")}</p>
      </header>

      {closed && (
        <p role="status" className="live-notice mt-6">
          {t("closed")}
        </p>
      )}

      <section aria-labelledby="upcoming" className="mt-8">
        <h2 id="upcoming" className="app-section-title">
          {t("upcoming")}
        </h2>
        {upcoming.length === 0 ? (
          <div className="app-empty mt-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-caret">
              <CalendarDays aria-hidden className="size-6" />
            </span>
            <p className="max-w-lg text-pretty text-muted-foreground">{t("emptyUpcoming")}</p>
          </div>
        ) : (
          byDay(upcoming).map((day) => (
            <div key={day.day} className="live-day">
              <h3 className="live-day__title">{title(day.items[0].starts_at)}</h3>
              <ul className="live-list">
                {day.items.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    time={timeRange(format, lesson.starts_at, lesson.ends_at)}
                    opensLabel={clock(format, lesson.opens_at)}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section aria-labelledby="past" className="mt-10">
        <h2 id="past" className="app-section-title">
          {t("past")}
        </h2>
        {past.length === 0 ? (
          <p className="mt-3 text-muted-foreground">{t("emptyPast")}</p>
        ) : (
          byDay(past).map((day) => (
            <div key={day.day} className="live-day">
              <h3 className="live-day__title">{title(day.items[0].starts_at)}</h3>
              <ul className="live-list">
                {day.items.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    time={timeRange(format, lesson.starts_at, lesson.ends_at)}
                    opensLabel={clock(format, lesson.opens_at)}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </>
  );
}
