import { ArrowRight, GraduationCap, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CONTACT_SECTION } from "@/components/site/sections";
import { Button } from "@/components/ui/button";
import { CourseTile } from "@/features/dashboard/course-tile";
import { KidsHome } from "@/features/dashboard/kids-home";
import { audienceOf } from "@/features/dashboard/nav";
import { ExamCallout, needsWork } from "@/features/exams/exam-callout";
import { RewardsCard } from "@/features/rewards/rewards-card";
import { NextLive } from "@/features/live/next-live";
import { TelegramPrompt } from "@/features/notifications/telegram-prompt";
import { Link } from "@/i18n/navigation";
import { getMyExams } from "@/lib/api/exams";
import { getMyCourse, getMyCourses } from "@/lib/api/learning";
import { getSchedule } from "@/lib/api/live";
import { getMe } from "@/lib/api/me";
import { getNotificationSettings } from "@/lib/api/notifications";
import { getRewards } from "@/lib/api/rewards";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("title"), robots: { index: false } };
}

export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, me, courses, notifications, exams, rewards] = await Promise.all([
    getTranslations("Dashboard"),
    getMe(locale),
    getMyCourses(locale),
    getNotificationSettings(locale),
    getMyExams(locale),
    getRewards(locale),
  ]);
  const audience = audienceOf(me?.audience);
  const name = me?.first_name || me?.full_name || "";

  if (audience === "KIDS") {
    // Bolalar kabineti: xarita uchun avval bolalar kursi, bo'lmasa birinchi kurs olinadi.
    const main = courses.find((course) => course.audience === "KIDS") ?? courses[0];
    const current = main ? await getMyCourse(locale, main.slug) : null;
    return <KidsHome name={name} courses={courses} current={current} />;
  }
  // "Davom ettirish" boshlangan, lekin tugatilmagan birinchi kursdan olinadi.
  const current = courses.find((course) => course.percent > 0 && course.percent < 100);
  const upcoming = me?.has_schedule ? await getSchedule(locale, "upcoming") : [];
  const nextLive = upcoming.find((lesson) => !lesson.canceled);
  const exam = exams.find(needsWork);

  return (
    <>
      <header>
        <h1 className="app-title">{t("greeting", { name })}</h1>
        <p className="mt-3 max-w-xl text-pretty text-muted-foreground">{t("intro")}</p>
      </header>

      {notifications && <TelegramPrompt settings={notifications} className="mt-8" />}

      {exam && <ExamCallout exam={exam} />}

      {rewards && courses.length > 0 && <RewardsCard rewards={rewards} />}

      {nextLive && <NextLive lesson={nextLive} />}

      {current?.next_lesson_id && (
        <section aria-labelledby="continue" className="app-card mt-8">
          <h2 id="continue" className="app-section-title flex items-center gap-2">
            <PlayCircle aria-hidden className="size-5 text-caret" />
            {t("continueTitle")}
          </h2>
          <p className="mt-2 text-pretty text-muted-foreground">{t("continueText")}</p>
          <p className="mt-4 font-medium">{current.title}</p>
          <Button asChild className="mt-4 h-11 gap-2 rounded-full px-5">
            <Link href={`/dashboard/courses/${current.slug}/lessons/${current.next_lesson_id}`}>
              {t("continueCourse")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </section>
      )}

      <section aria-labelledby="my-courses" className="mt-10">
        <h2 id="my-courses" className="app-section-title">
          {t("coursesTitle")}
        </h2>

        {courses.length > 0 ? (
          <div className="course-grid mt-5">
            {courses.map((course) => (
              <CourseTile key={course.slug} course={course} audience={audience} />
            ))}
          </div>
        ) : (
          <div className="app-empty mt-5">
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-caret">
              <GraduationCap aria-hidden className="size-6" />
            </span>
            <p className="max-w-lg text-pretty text-muted-foreground">{t("coursesEmpty")}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="h-11 gap-2 rounded-full px-5">
                <Link href="/dashboard/catalog">
                  {t("browseCourses")}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-full px-5">
                <Link href={{ pathname: "/", hash: CONTACT_SECTION }}>{t("getConsult")}</Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
