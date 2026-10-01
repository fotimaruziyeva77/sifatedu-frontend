import { ArrowRight, BookOpen, Clock, GraduationCap, Languages, Video } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createElement } from "react";

import { Button } from "@/components/ui/button";
import { NamedIcon } from "@/features/landing/icons";
import { LeadSection } from "@/features/leads/lead-section";
import { BuyPanel } from "@/features/payments/buy-panel";
import { Link } from "@/i18n/navigation";
import type { CourseDetail } from "@/lib/api/catalog";
import type { SitePayload } from "@/lib/api/site";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CourseProgram } from "./course-program";
import { EnrollButton } from "./enroll-button";
import { priceLines } from "./price";
import { StartFreeButton } from "./start-free-button";
import { trackColor, trackOf } from "./tracks";

/**
 * Kurs sahifasi. Ochiq saytda (`/courses/…`) va kabinet ichida (`/dashboard/catalog/…`) bir xil:
 * kabinetda menyu saqlanadi, kurs allaqachon ochiq bo'lsa sotib olish o'rniga "Kursga o'tish".
 */
export async function CourseDetailView({
  course,
  site,
  locale,
  base,
  access = null,
}: {
  course: CourseDetail;
  site: SitePayload | null;
  locale: string;
  base: "/courses" | "/dashboard/catalog";
  /** Kabinetda: kursga kirish bor bo'lsa, shu yerga olib boruvchi havola. */
  access?: { href: string } | null;
}) {
  const inApp = base === "/dashboard/catalog";
  const [t, tLevel] = await Promise.all([getTranslations("Course"), getTranslations("Level")]);
  const accent = trackColor(trackOf(course.category.slug));
  const hours = Math.round(course.total_duration_min / 60);
  const payments = site?.settings.payments_enabled ?? false;
  const prices = priceLines(course, locale, {
    free: t("free"),
    price: (value) => t("price", { price: value }),
    once: t("once"),
    monthly: t("monthly"),
  });

  const facts = [
    { icon: BookOpen, label: t("lessonCount", { count: course.lesson_count }) },
    { icon: Clock, label: hours > 0 ? t("hours", { count: hours }) : null },
    { icon: GraduationCap, label: tLevel(course.level) },
    {
      icon: Languages,
      label: t("videoLanguage", { language: course.video_language.toUpperCase() }),
    },
  ].filter((fact): fact is { icon: typeof BookOpen; label: string } => Boolean(fact.label));

  // Kabinetda kontent kengligini ramkaning o'zi belgilaydi.
  const wrap = inApp
    ? "grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-12"
    : "mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.5fr_1fr] lg:gap-16";
  const bodyWrap = inApp
    ? "grid gap-12 pb-12 lg:grid-cols-[1.5fr_1fr] lg:gap-12"
    : "mx-auto grid max-w-7xl gap-12 px-4 pb-24 sm:px-6 sm:pb-32 lg:grid-cols-[1.5fr_1fr] lg:gap-16";

  return (
    <article style={{ "--track": accent } as React.CSSProperties}>
      <header className={cn("course-hero", inApp && "course-hero--app")}>
        <div className={wrap}>
          <div>
            <nav aria-label={t("breadcrumb")} className="course-breadcrumb">
              <Link href={base}>{t("allCourses")}</Link>
              <span aria-hidden>/</span>
              <Link href={{ pathname: base, query: { category: course.category.slug } }}>
                {course.category.name}
              </Link>
            </nav>

            <h1 className="course-title mt-4">{course.title}</h1>
            {course.short_description && (
              <p className="mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">
                {course.short_description}
              </p>
            )}

            <ul className="course-facts">
              {facts.map((fact) => (
                <li key={fact.label}>
                  {createElement(fact.icon, { "aria-hidden": true, className: "size-4" })}
                  {fact.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Narx paneli: katta ekranda scroll paytida yonida qolib ketadi. */}
          <aside className="course-buy">
            <div className="course-buy__card">
              {course.cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- ochiq S3 rasmi
                <img src={course.cover} alt="" className="course-buy__cover" loading="lazy" />
              ) : (
                <span aria-hidden className="course-buy__icon">
                  <NamedIcon name={course.icon} className="size-8" />
                </span>
              )}

              {access ? (
                <>
                  <p className="course-buy__owned">{t("owned")}</p>
                  <Button asChild className="mt-5 h-13 w-full gap-2 rounded-full text-base">
                    <Link href={access.href}>
                      {t("goToCourse")}
                      <ArrowRight aria-hidden className="size-5" />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <div className="course-buy__price">
                    {prices.map((line) => (
                      <p key={line.unit || line.amount}>
                        {line.amount}
                        {line.unit && <span className="course-buy__unit">{line.unit}</span>}
                      </p>
                    ))}
                  </div>
                  <p className="course-buy__note">{t("priceNote")}</p>
                  <div className="mt-6">
                    {course.is_free ? (
                      <StartFreeButton slug={course.slug} label={t("startFree")} />
                    ) : payments ? (
                      <BuyPanel
                        slug={course.slug}
                        studyFormat={course.study_format}
                        priceOnline={course.price_online}
                        priceOfflineMonthly={course.price_offline_monthly}
                      />
                    ) : (
                      // To'lov tizimi ulanmaguncha ariza formasiga yuboriladi.
                      <EnrollButton slug={course.slug} label={t("enroll")} />
                    )}
                  </div>
                </>
              )}
              <ul className="course-buy__perks">
                <li>{t("perkLifetime")}</li>
                <li>{t("perkPractice")}</li>
                <li>{t("perkSupport")}</li>
              </ul>
            </div>
          </aside>
        </div>
      </header>

      <div className={bodyWrap}>
        <div className="min-w-0">
          {course.description && (
            <section aria-labelledby="about-course" className="course-block">
              <h2 id="about-course" className="course-section-title">
                {t("about")}
              </h2>
              {/* Backend'da tozalangan HTML (nh3). */}
              <div
                className="legal-content mt-5"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
            </section>
          )}

          <section aria-labelledby="program" className="course-block">
            <h2 id="program" className="course-section-title">
              {t("program")}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t("programSummary", {
                modules: course.modules.length,
                lessons: course.lesson_count,
              })}
            </p>
            <div className="mt-6">
              <CourseProgram modules={course.modules} />
            </div>
          </section>

          {course.instructors.length > 0 && (
            <section aria-labelledby="mentors" className="course-block">
              <h2 id="mentors" className="course-section-title">
                {t("mentors")}
              </h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {course.instructors.map((instructor) => (
                  <li key={instructor.slug} className="course-mentor">
                    {instructor.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- ochiq S3 rasmi
                      <img
                        src={instructor.photo}
                        alt=""
                        loading="lazy"
                        className="size-14 rounded-full object-cover"
                      />
                    ) : (
                      <span aria-hidden className="course-mentor__initials">
                        {initials(instructor.full_name)}
                      </span>
                    )}
                    <div>
                      <p className="font-semibold">{instructor.full_name}</p>
                      {instructor.position && (
                        <p className="text-sm text-muted-foreground">{instructor.position}</p>
                      )}
                      {instructor.bio && (
                        <p className="mt-2 line-clamp-3 text-sm text-pretty text-muted-foreground">
                          {instructor.bio}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="course-side">
          <div className="course-side__card">
            <h2 className="flex items-center gap-2 font-semibold">
              <Video aria-hidden className="size-5 text-caret" />
              {t("howTitle")}
            </h2>
            <p className="mt-3 text-sm text-pretty text-muted-foreground">{t("howText")}</p>
            <Link
              href={base}
              className="mt-5 inline-block text-sm font-medium underline underline-offset-4"
            >
              {t("allCourses")}
            </Link>
          </div>
        </aside>
      </div>

      {/* Ariza formasi: ochiq saytda doim; kabinetda — faqat to'lov ulanmagan bo'lsa. */}
      {(!inApp || (!payments && !access && !course.is_free)) && (
        <LeadSection site={site} course={{ slug: course.slug, title: course.title }} />
      )}
    </article>
  );
}
