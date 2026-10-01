import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import type { CourseCard as CourseCardData } from "@/lib/api/site";

import { InlineChat } from "@/features/assistant/inline-chat";
import { CourseCard } from "@/features/catalog/course-card";
import { Quiz, type QuizCourse } from "./quiz";
import { delay, SectionHeading } from "./section";

/**
 * Taklif: kasb testi (ikkilanayotganlar uchun), uning yonida AI maslahatchi va kurs kartochkalari.
 */
export async function Courses({
  courses,
  assistant = false,
}: {
  courses: readonly CourseCardData[];
  assistant?: boolean;
}) {
  const t = await getTranslations("Courses");
  const quizCourses: QuizCourse[] = courses.map((course) => ({
    slug: course.slug,
    title: course.title,
    category: course.category.slug,
    hours: course.duration_hours ?? null,
  }));

  return (
    <section id="courses" aria-labelledby="courses-title" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          id="courses-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        {assistant ? (
          <div className="quiz-grid">
            <Quiz courses={quizCourses} />
            <InlineChat />
          </div>
        ) : (
          <Quiz courses={quizCourses} />
        )}
        {courses.length > 0 ? (
          <ul className="mt-6 grid gap-5 md:grid-cols-2">
            {courses.map((course, index) => (
              <li key={course.slug} data-reveal style={delay((index % 2) * 90)}>
                <CourseCard course={course} trackLabel={course.category.name} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 max-w-xl text-pretty text-muted-foreground">{t("empty")}</p>
        )}

        {courses.length > 0 && (
          <div data-reveal className="mt-10 flex justify-center">
            <Button
              asChild
              variant="outline"
              data-magnetic
              className="h-12 gap-2 rounded-full px-6"
            >
              <Link href="/courses">
                {t("all")}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
