import { ArrowLeft, ArrowRight, Check, Clock, Loader2, Lock, VideoOff } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { LessonList } from "@/features/dashboard/lesson-list";
import { HomeworkPanel, type HomeworkDates } from "@/features/homework/homework-panel";
import { LessonMaterials } from "@/features/lesson/materials";
import { VideoPlayer } from "@/features/player/video-player";
import { QuizPanel } from "@/features/quiz/quiz-panel";
import { notFoundMetadata } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import { getLesson, getMyCourse, type MyCourseDetail, type MyLesson } from "@/lib/api/learning";

export const dynamic = "force-dynamic";

/** Onlayn o'quvchi: dars oldingi darsning testi o'tilmagani uchun yopiq. */
function quizLock(
  course: MyCourseDetail | null,
  lessonId: number,
): { lesson: MyLesson; blocker: MyLesson } | null {
  const lessons = course?.modules.flatMap((module) => module.lessons) ?? [];
  const lesson = lessons.find((item) => item.id === lessonId);
  const blocker = lessons.find((item) => item.id === lesson?.blocked_by);
  return lesson?.lock_reason === "quiz" && blocker ? { lesson, blocker } : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/courses/[slug]/lessons/[id]">): Promise<Metadata> {
  const { locale, slug, id } = await params;
  const lesson = await getLesson(locale, Number(id));
  if (!lesson) {
    const lock = quizLock(await getMyCourse(locale, slug), Number(id));
    if (!lock) return notFoundMetadata(locale);
    return { title: lock.lesson.title, robots: { index: false } };
  }
  return { title: lesson.title, robots: { index: false } };
}

export default async function LessonPage({
  params,
}: PageProps<"/[locale]/dashboard/courses/[slug]/lessons/[id]">) {
  const { locale, slug, id } = await params;
  setRequestLocale(locale);
  const lessonId = Number(id);
  if (!Number.isInteger(lessonId) || lessonId <= 0) notFound();

  const [t, format, lesson, course] = await Promise.all([
    getTranslations("Learn"),
    getFormatter(),
    getLesson(locale, lessonId),
    getMyCourse(locale, slug),
  ]);
  // Huquq yo'q bo'lsa backend 403 qaytaradi va `getLesson` null beradi. Test sababli yopiq
  // darsda — nima qilish kerakligi tushuntiriladi.
  if (!lesson) {
    const lock = quizLock(course, lessonId);
    if (!course || !lock) notFound();
    return (
      <div className="lesson-layout">
        <article>
          <nav aria-label={t("backToCourse")} className="mb-4">
            <Link
              href={`/dashboard/courses/${slug}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft aria-hidden className="size-4" />
              {course.title}
            </Link>
          </nav>
          <section className="lesson-locked app-card">
            <span aria-hidden className="lesson-locked__icon">
              <Lock className="size-6" />
            </span>
            <p className="text-sm text-muted-foreground">{lock.lesson.title}</p>
            <h1 className="app-title text-[clamp(1.5rem,3vw,2rem)]">{t("lockedTitle")}</h1>
            <p className="text-pretty">{t("lockedBody", { lesson: lock.blocker.title })}</p>
            <Button asChild className="h-11 gap-2 self-start rounded-full px-5">
              <Link href={`/dashboard/courses/${slug}/lessons/${lock.blocker.id}#quiz`}>
                {t("lockedGo")}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </Button>
          </section>
        </article>
        <aside className="app-card lg:sticky lg:top-20">
          <h2 className="app-section-title">{t("program")}</h2>
          <div className="mt-3">
            <LessonList slug={slug} modules={course.modules} currentId={lessonId} />
          </div>
        </aside>
      </div>
    );
  }
  if (lesson.course_slug !== slug) notFound();

  const video = lesson.video;
  // Sanalar serverda formatlanadi: brauzerlarda o'zbekcha oy nomlari yo'q.
  const when = (value: string) =>
    format.dateTime(new Date(value), {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  const homework = lesson.homework;
  const homeworkDates: HomeworkDates | null = homework
    ? {
        deadline: homework.deadline ? when(homework.deadline) : null,
        attempts: Object.fromEntries(
          homework.attempts.map((item) => [
            item.id,
            {
              created: when(item.created_at),
              reviewed: item.reviewed_at ? when(item.reviewed_at) : null,
            },
          ]),
        ),
      }
    : null;
  const ready = video?.status === "READY" && video.hls_url !== "";

  return (
    <div className="lesson-layout">
      <article>
        <nav aria-label={t("backToCourse")} className="mb-4">
          <Link
            href={`/dashboard/courses/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft aria-hidden className="size-4" />
            {lesson.course_title}
          </Link>
        </nav>

        <div id="lesson-video" className="scroll-mt-20">
          {ready && video ? (
            <VideoPlayer
              lessonId={lesson.id}
              src={video.hls_url}
              poster={video.poster}
              startAt={lesson.progress.position_sec}
              watermark={lesson.watermark}
              nextAnchor={lesson.quiz ? "quiz" : undefined}
            />
          ) : (
            <p className="player-fallback">
              {video?.status === "PROCESSING" ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                  {t("processing")}
                </span>
              ) : video?.status === "FAILED" ? (
                t("failed")
              ) : (
                <span className="inline-flex items-center gap-2">
                  <VideoOff aria-hidden className="size-4" />
                  {t("noVideo")}
                </span>
              )}
            </p>
          )}
        </div>

        <header className="mt-6">
          <p className="text-sm text-muted-foreground">{lesson.module_title}</p>
          <h1 className="app-title mt-1 text-[clamp(1.5rem,3vw,2rem)]">{lesson.title}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden className="size-4" />
              {lesson.duration_min}
            </span>
            {lesson.progress.completed && (
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <Check aria-hidden className="size-4 text-caret" />
                {t("completed")}
              </span>
            )}
            {lesson.is_preview && <span>{t("preview")}</span>}
          </p>
          {lesson.summary && <p className="mt-4 text-pretty">{lesson.summary}</p>}
          {ready && <p className="mt-4 text-xs text-muted-foreground">{t("shortcuts")}</p>}
        </header>

        <LessonMaterials materials={lesson.materials} />

        {lesson.tasks_locked && (
          <p className="live-notice mt-8" role="note">
            {t("tasksLocked")}
          </p>
        )}

        {lesson.quiz && (
          <QuizPanel
            quiz={lesson.quiz}
            nextHref={
              lesson.next_id ? `/dashboard/courses/${slug}/lessons/${lesson.next_id}` : null
            }
          />
        )}

        {homework && homeworkDates && <HomeworkPanel homework={homework} dates={homeworkDates} />}

        <nav aria-label={t("program")} className="mt-8 flex flex-wrap gap-3">
          {lesson.prev_id && (
            <Button asChild variant="outline" className="h-10 gap-2 rounded-full px-4">
              <Link href={`/dashboard/courses/${slug}/lessons/${lesson.prev_id}`}>
                <ArrowLeft aria-hidden className="size-4" />
                {t("prev")}
              </Link>
            </Button>
          )}
          {lesson.next_id && (
            <Button asChild className="h-10 gap-2 rounded-full px-4">
              <Link href={`/dashboard/courses/${slug}/lessons/${lesson.next_id}`}>
                {t("next")}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </Button>
          )}
        </nav>
      </article>

      {course && (
        <aside className="app-card lg:sticky lg:top-20">
          <h2 className="app-section-title">{t("program")}</h2>
          <div className="mt-3">
            <LessonList slug={slug} modules={course.modules} currentId={lesson.id} />
          </div>
        </aside>
      )}
    </div>
  );
}
