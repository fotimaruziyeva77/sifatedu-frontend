import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { CourseDetailView } from "@/features/catalog/course-detail";
import { notFoundMetadata } from "@/i18n/alternates";
import { getCourse } from "@/lib/api/catalog";
import { getMyCourse } from "@/lib/api/learning";
import { getSite } from "@/lib/api/site";

import "../../../../(site)/courses/catalog.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/catalog/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = await getCourse(locale, slug);
  if (!course) return notFoundMetadata(locale);
  return { title: course.title, robots: { index: false } };
}

/** Kurs sahifasi kabinet ichida. Kurs ochiq bo'lsa, sotib olish o'rniga — "Kursga o'tish". */
export default async function DashboardCoursePage({
  params,
}: PageProps<"/[locale]/dashboard/catalog/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [course, site, mine] = await Promise.all([
    getCourse(locale, slug),
    getSite(locale),
    getMyCourse(locale, slug),
  ]);
  if (!course) notFound();

  return (
    <CourseDetailView
      course={course}
      site={site}
      locale={locale}
      base="/dashboard/catalog"
      access={mine ? { href: `/dashboard/courses/${slug}` } : null}
    />
  );
}
