import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PrintSlides } from "@/features/lesson/slides/print-slides";
import { slideList } from "@/features/lesson/slides/types";
import { getLesson } from "@/lib/api/learning";
import { getMe } from "@/lib/api/me";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/slides/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const [t, lesson] = await Promise.all([
    getTranslations({ locale, namespace: "Learn" }),
    getLesson(locale, Number(id)),
  ]);
  return {
    title: lesson ? t("slidesTitle", { title: lesson.title }) : t("slides"),
    robots: { index: false },
  };
}

/** Dars slaydlari chop etish uchun (brauzerda «PDF sifatida saqlash»). */
export default async function SlidesPrintPage({ params }: PageProps<"/[locale]/slides/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const lessonId = Number(id);
  if (!Number.isInteger(lessonId) || lessonId <= 0) notFound();

  const [me, lesson] = await Promise.all([getMe(locale), getLesson(locale, lessonId)]);
  if (!me && !lesson) redirect(`/${locale}/auth/login?next=/slides/${lessonId}`);
  const slides = slideList(lesson?.slides);
  if (!lesson || slides.length === 0) notFound();

  return <PrintSlides title={lesson.title} slides={slides} />;
}
