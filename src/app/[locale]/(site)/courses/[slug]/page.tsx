import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CourseDetailView } from "@/features/catalog/course-detail";
import { localeAlternates, notFoundMetadata } from "@/i18n/alternates";
import { type CourseDetail, getCourse } from "@/lib/api/catalog";
import { getSite } from "@/lib/api/site";

import "../catalog.css";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/courses/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = await getCourse(locale, slug);
  if (!course) return notFoundMetadata(locale);

  return {
    title: course.title,
    description: course.short_description,
    alternates: localeAlternates(locale, `/courses/${slug}`),
    openGraph: {
      type: "website",
      title: course.title,
      description: course.short_description,
      ...(course.cover ? { images: [course.cover] } : {}),
    },
  };
}

export default async function CoursePage({ params }: PageProps<"/[locale]/courses/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [course, site] = await Promise.all([getCourse(locale, slug), getSite(locale)]);
  if (!course) notFound();

  return (
    <>
      <CourseJsonLd course={course} locale={locale} />
      <CourseDetailView course={course} site={site} locale={locale} base="/courses" />
    </>
  );
}

async function CourseJsonLd({ course, locale }: { course: CourseDetail; locale: string }) {
  const language = await getLocale();
  const data = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.short_description,
    inLanguage: language,
    url: `${APP_URL}/${locale}/courses/${course.slug}`,
    provider: { "@type": "EducationalOrganization", name: "Sifat Edu", url: APP_URL },
    ...(course.instructors.length > 0 && {
      instructor: course.instructors.map((instructor) => ({
        "@type": "Person",
        name: instructor.full_name,
        ...(instructor.position ? { jobTitle: instructor.position } : {}),
      })),
    }),
    offers: {
      "@type": "Offer",
      // Onlayn (bir martalik) narx: qidiruv tizimlari uchun tushunarli qiymat.
      price: course.is_free ? 0 : course.price_online,
      priceCurrency: "UZS",
      category: course.is_free ? "Free" : "Paid",
    },
  };

  return (
    <script
      type="application/ld+json"
      // JSON ichidagi "<" belgisi script tegini yopib qo'ymasligi uchun ekranlanadi.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
