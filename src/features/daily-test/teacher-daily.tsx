import { getFormatter, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { TeacherDaily } from "@/lib/api/daily-test";

import { DailyStrip } from "./daily-strip";

/** Kun ("2026-10-05") — kun o'rtasi bilan: vaqt mintaqasi sanani surib yubormasin. */
const noon = (value: string) => new Date(`${value}T12:00:00Z`);

/**
 * O'qituvchi guruh sahifasida: kunlik testni kim ishladi (natijasi bilan) va kim ishlamadi —
 * ishlamaganlar tepada. Oxirgi kunlar orasida `?daily=YYYY-MM-DD` bilan o'tiladi.
 */
export async function TeacherDailySection({
  groupId,
  data,
}: {
  groupId: number;
  data: TeacherDaily;
}) {
  const [t, format] = await Promise.all([getTranslations("DailyTest"), getFormatter()]);
  const day = (value: string) => format.dateTime(noon(value), { day: "numeric", month: "long" });
  const total = data.students.length;

  return (
    <section aria-labelledby="daily-test" className="app-card mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="daily-test" className="app-section-title">
          {t("teacherTitle")}
        </h2>
        <p className="text-sm text-muted-foreground tabular-nums">
          {day(data.day)}
          {data.status !== "NONE" &&
            data.status !== "SKIPPED" &&
            ` · ${t("teacherDone", { done: data.done, total })}`}
        </p>
      </div>

      {data.recent.length > 1 && (
        <nav aria-label={t("teacherDays")} className="rv-groups mt-3">
          {data.recent.map((item) => (
            <Link
              key={item.day}
              href={`/dashboard/teaching/${groupId}?daily=${item.day}`}
              className="teach-chip"
              aria-current={item.day === data.day ? "page" : undefined}
            >
              {day(item.day)}
              {item.status !== "SKIPPED" && <span className="tabular-nums"> · {item.done}</span>}
            </Link>
          ))}
        </nav>
      )}

      {data.status === "NONE" || data.status === "SKIPPED" ? (
        <p className="mt-3 text-pretty text-muted-foreground">
          {data.status === "SKIPPED" || data.pool_size < 20
            ? t("teacherShort", { have: data.pool_size, need: data.questions_count || 20 })
            : t("teacherNoTest")}
        </p>
      ) : (
        <ul className="daily-roll mt-4">
          {data.students.map((student) => (
            <li key={student.id} data-status={student.status}>
              <span className="daily-roll__name">{student.name}</span>
              {student.status === "DONE" && student.correct !== null && student.total !== null ? (
                <span className="daily-roll__score">
                  <DailyStrip
                    correct={student.correct}
                    total={student.total}
                    label={t("stripLabel", { right: student.correct, total: student.total })}
                  />
                  <strong className="tabular-nums">
                    {student.correct}/{student.total}
                  </strong>
                </span>
              ) : (
                <span className="daily-roll__state">{t(`teacherStatus.${student.status}`)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
