import { ArrowRight, Check, Send } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { DailyTask } from "@/lib/api/rewards";

/**
 * Bugungi topshiriqlar: nima, bajarilganmi va qayerda bajariladi (dars, test, vazifa, jadval;
 * takrorlash — Telegram botda). Bajarilgani hodisadan o'zi belgilanadi.
 */
export async function TaskList({
  tasks,
  compact = false,
}: {
  tasks: DailyTask[];
  compact?: boolean;
}) {
  const t = await getTranslations("Rewards");

  if (tasks.length === 0) {
    return <p className="text-muted-foreground">{t("tasksEmpty")}</p>;
  }
  return (
    <ol className="rw-tasks" data-compact={compact ? "" : undefined}>
      {tasks.map((task) => {
        const title = t(`task.${task.kind}`, { title: task.title });
        const external = task.kind === "REVIEW";
        return (
          <li key={task.id} className="rw-task" data-done={task.done ? "" : undefined}>
            <span aria-hidden className="rw-task__mark">
              {task.done && <Check className="size-4" />}
            </span>
            <span className="rw-task__title">
              {title}
              <span className="sr-only">{task.done ? t("taskDone") : t("taskOpen")}</span>
            </span>
            {!task.done &&
              task.url &&
              !compact &&
              (external ? (
                <a
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rw-task__go"
                >
                  <Send aria-hidden className="size-4" />
                  {t("inBot")}
                </a>
              ) : (
                <Link href={task.url} className="rw-task__go">
                  {t("doIt")}
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              ))}
          </li>
        );
      })}
    </ol>
  );
}
