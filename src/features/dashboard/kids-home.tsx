import { ArrowRight, Check, Lock, Play, Rocket, Star, Trophy } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { NamedIcon } from "@/features/landing/icons";
import { Link } from "@/i18n/navigation";
import type { MyCourse, MyCourseDetail } from "@/lib/api/learning";
import { cn } from "@/lib/utils";

import { KidsBot } from "./kids-bot";

import "./kids.css";

type Medal = { key: string; icon: typeof Star; earned: boolean };

/** Medallar progressdan hisoblanadi (XP tizimi 14-qadamda qo'shiladi). */
function medalsFor(done: number, course: MyCourseDetail | null): Medal[] {
  const moduleDone = course?.modules.some(
    (module) => module.lessons.length > 0 && module.lessons.every((lesson) => lesson.completed),
  );
  const courseDone = course
    ? course.lesson_count > 0 && course.completed_count >= course.lesson_count
    : false;
  return [
    { key: "first", icon: Rocket, earned: done >= 1 },
    { key: "five", icon: Star, earned: done >= 5 },
    { key: "module", icon: Trophy, earned: Boolean(moduleDone) },
    { key: "course", icon: Check, earned: courseDone },
  ];
}

/**
 * SIFAT Kids kabineti (7–11 yosh): kam matn, yirik tugmalar, darslar — sarguzasht xaritasi,
 * progress — yulduz va medallar. Kattalar kabinetidan butunlay boshqa ko'rinish.
 */
export async function KidsHome({
  name,
  courses,
  current,
}: {
  name: string;
  courses: MyCourse[];
  /** Hozirgi kursning dasturi (xarita uchun). */
  current: MyCourseDetail | null;
}) {
  const t = await getTranslations("Kids");
  const stars = courses.reduce((sum, course) => sum + course.completed_count, 0);
  const medals = medalsFor(stars, current);
  const next = current?.next_lesson_id ?? null;
  const nextTitle = current?.modules
    .flatMap((module) => module.lessons)
    .find((lesson) => lesson.id === next)?.title;

  return (
    <div className="kids">
      <section className="kids-hero" aria-labelledby="kids-hello">
        <KidsBot className="kids-hero__bot" />
        <div>
          <h1 id="kids-hello" className="kids-hero__title">
            {t("hello", { name })}
          </h1>
          <p className="kids-hero__lead">{t("lead")}</p>
          <ul className="kids-counters">
            <li>
              <Star aria-hidden className="size-6" />
              {t("stars", { count: stars })}
            </li>
            <li>
              <Trophy aria-hidden className="size-6" />
              {t("medals", { count: medals.filter((medal) => medal.earned).length })}
            </li>
          </ul>
        </div>
      </section>

      {current && next ? (
        <section className="kids-mission" aria-labelledby="kids-mission">
          <p id="kids-mission" className="kids-mission__label">
            {t("missionTitle")}
          </p>
          <p className="kids-mission__lesson">{nextTitle}</p>
          <Button asChild className="kids-mission__go">
            <Link href={`/dashboard/courses/${current.slug}/lessons/${next}`}>
              <Play aria-hidden className="size-6 fill-current" />
              {t("go")}
            </Link>
          </Button>
        </section>
      ) : (
        <section className="kids-mission" aria-labelledby="kids-mission">
          <p id="kids-mission" className="kids-mission__label">
            {t("noCourseTitle")}
          </p>
          <p className="kids-mission__lesson">{t("noCourseText")}</p>
          <Button asChild className="kids-mission__go">
            <Link href="/dashboard/catalog?category=bolalar">
              {t("pickCourse")}
              <ArrowRight aria-hidden className="size-6" />
            </Link>
          </Button>
        </section>
      )}

      {current && (
        <section className="kids-map" aria-labelledby="kids-map">
          <h2 id="kids-map" className="kids-section-title">
            <NamedIcon name={current.icon} className="size-7" />
            {t("mapTitle")}
          </h2>
          {current.modules.map((module, moduleIndex) => (
            <div key={module.id} className="kids-island" data-tone={moduleIndex % 4}>
              <h3 className="kids-island__title">{module.title}</h3>
              <ol className="kids-path">
                {module.lessons.map((lesson, index) => {
                  const state = lesson.completed
                    ? "done"
                    : lesson.id === next
                      ? "current"
                      : lesson.locked
                        ? "locked"
                        : "todo";
                  const node = (
                    <>
                      <span aria-hidden className="kids-stone__mark">
                        {state === "done" ? (
                          <Star className="size-6 fill-current" />
                        ) : state === "locked" ? (
                          <Lock className="size-5" />
                        ) : state === "current" ? (
                          <Play className="size-6 fill-current" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="kids-stone__name">{lesson.title}</span>
                      <span className="sr-only">{t(`state.${state}`)}</span>
                    </>
                  );
                  return (
                    <li key={lesson.id} className="kids-stone" data-state={state}>
                      {state === "locked" ? (
                        <span className="kids-stone__body">{node}</span>
                      ) : (
                        <Link
                          href={`/dashboard/courses/${current.slug}/lessons/${lesson.id}`}
                          className="kids-stone__body"
                        >
                          {node}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </section>
      )}

      <section className="kids-medals" aria-labelledby="kids-medals">
        <h2 id="kids-medals" className="kids-section-title">
          <Trophy aria-hidden className="size-7" />
          {t("medalsTitle")}
        </h2>
        <ul className="kids-medals__grid">
          {medals.map(({ key, icon: Icon, earned }) => (
            <li key={key} className={cn("kids-medal", earned && "is-earned")}>
              <span aria-hidden className="kids-medal__icon">
                <Icon className="size-8" />
              </span>
              <span className="kids-medal__name">{t(`medal.${key}`)}</span>
              <span className="sr-only">{earned ? t("earned") : t("notYet")}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
