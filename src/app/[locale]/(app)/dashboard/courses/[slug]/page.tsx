import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CourseHeader } from "@/features/dashboard/course-header";
import { LessonList } from "@/features/dashboard/lesson-list";
import { notFoundMetadata } from "@/i18n/alternates";
import { getMyCourse } from "@/lib/api/learning";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/courses/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = await getMyCourse(locale, slug);
  if (!course) return notFoundMetadata(locale);
  return { title: course.title, robots: { index: false } };
}

export default async function MyCoursePage({
  params,
}: PageProps<"/[locale]/dashboard/courses/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [t, course] = await Promise.all([getTranslations("Dashboard"), getMyCourse(locale, slug)]);
  // Huquq yo'q yoki kurs yo'q — ikkalasi ham 404: mavjudligini ochib bermaydi.
  if (!course) notFound();

  return (
    <>
      <CourseHeader course={course} />

      <section aria-labelledby="program" className="app-card mt-8">
        <h2 id="program" className="app-section-title">
          {t("program")}
        </h2>
        <div className="mt-3">
          <LessonList slug={course.slug} modules={course.modules} />
        </div>
      </section>
    </>
  );
}
