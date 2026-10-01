import { ArrowRight, GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { CourseTile } from "@/features/dashboard/course-tile";
import { audienceOf } from "@/features/dashboard/nav";
import { Link } from "@/i18n/navigation";
import { getMyCourses } from "@/lib/api/learning";
import { getMe } from "@/lib/api/me";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/courses">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("myCourses"), robots: { index: false } };
}

export default async function MyCoursesPage({ params }: PageProps<"/[locale]/dashboard/courses">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, me, courses] = await Promise.all([
    getTranslations("Dashboard"),
    getMe(locale),
    getMyCourses(locale),
  ]);
  const audience = audienceOf(me?.audience);

  return (
    <>
      <header>
        <h1 className="app-title">{audience === "KIDS" ? t("kidsCourses") : t("myCourses")}</h1>
        {courses.length > 0 && (
          <p className="mt-3 text-muted-foreground">
            {t("coursesCount", { count: courses.length })}
          </p>
        )}
      </header>

      {courses.length > 0 ? (
        <div className="course-grid mt-8">
          {courses.map((course) => (
            <CourseTile key={course.slug} course={course} audience={audience} />
          ))}
        </div>
      ) : (
        <div className="app-empty mt-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-caret">
            <GraduationCap aria-hidden className="size-6" />
          </span>
          <p className="max-w-lg text-pretty text-muted-foreground">{t("coursesEmpty")}</p>
          <Button asChild className="h-11 gap-2 rounded-full px-5">
            <Link href="/dashboard/catalog">
              {t("browseCourses")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
