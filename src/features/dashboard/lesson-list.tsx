import { Check, Lock, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { MyModule } from "@/lib/api/learning";

/**
 * Kurs dasturi: modullar va darslar. Dars sahifasida yon panel sifatida ham ishlatiladi,
 * shuning uchun `currentId` bilan joriy dars belgilanadi.
 */
export async function LessonList({
  slug,
  modules,
  currentId,
}: {
  slug: string;
  modules: MyModule[];
  currentId?: number;
}) {
  const t = await getTranslations("Learn");

  return (
    <div className="lesson-list">
      {modules.map((module) => (
        <section key={module.id} aria-label={module.title}>
          <h3 className="lesson-module">{module.title}</h3>
          {module.lessons.map((lesson) => {
            const mark = (
              <span
                aria-hidden
                className="lesson-row__mark"
                data-done={lesson.completed ? "" : undefined}
              >
                {lesson.completed ? <Check className="size-3" /> : null}
              </span>
            );
            const stars = lesson.quiz_stars;
            const label = (
              <>
                <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                {stars !== null && (
                  <span className="lesson-row__stars" title={t("quizStars", { count: stars })}>
                    {[0, 1, 2].map((index) => (
                      <Star key={index} aria-hidden data-on={index < stars ? "" : undefined} />
                    ))}
                    <span className="sr-only">{t("quizStars", { count: stars })}</span>
                  </span>
                )}
                <span className="shrink-0 text-xs tabular-nums">{lesson.duration_min}</span>
              </>
            );

            // Test sababli yopiq dars ochiladi-yu, sahifada nima qilish kerakligi tushuntiriladi.
            if (lesson.locked && lesson.lock_reason === "quiz") {
              return (
                <Link
                  key={lesson.id}
                  href={`/dashboard/courses/${slug}/lessons/${lesson.id}`}
                  className="lesson-row"
                  data-locked=""
                  title={t("lockedQuiz")}
                  aria-current={lesson.id === currentId ? "true" : undefined}
                >
                  <span aria-hidden className="lesson-row__mark">
                    <Lock className="size-3" />
                  </span>
                  {label}
                  <span className="sr-only">{t("lockedQuiz")}</span>
                </Link>
              );
            }

            if (lesson.locked) {
              return (
                <p key={lesson.id} className="lesson-row" data-locked="" title={t("locked")}>
                  <span aria-hidden className="lesson-row__mark">
                    <Lock className="size-3" />
                  </span>
                  {label}
                  <span className="sr-only">{t("locked")}</span>
                </p>
              );
            }

            return (
              <Link
                key={lesson.id}
                href={`/dashboard/courses/${slug}/lessons/${lesson.id}`}
                className="lesson-row"
                aria-current={lesson.id === currentId ? "true" : undefined}
              >
                {mark}
                {label}
                {lesson.completed && <span className="sr-only">{t("completed")}</span>}
              </Link>
            );
          })}
        </section>
      ))}
    </div>
  );
}
