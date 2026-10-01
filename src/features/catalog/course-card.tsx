"use client";

import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type CSSProperties, useRef } from "react";

import { CONTACT_SECTION } from "@/components/site/sections";
import { selectCourseForLead } from "@/features/leads/select-course";
import { Link } from "@/i18n/navigation";
import type { CourseCard as CourseCardData } from "@/lib/api/site";

import { CoursePreview } from "./course-preview";
import { primaryPrice } from "./price";
import { trackColor, trackOf } from "./tracks";

import "./course-card.css";

const MAX_TILT_DEG = 4;

/** Kurs kartochkasi: yo'nalish rangida, "nimani yasaysiz" animatsiyasi, hover'da 3D egilish. */
export function CourseCard({
  course,
  trackLabel,
  href,
}: {
  course: CourseCardData;
  trackLabel: string;
  /** Kurs sahifasi. Berilsa, kartochka butunlay bosiladigan bo'ladi va "Batafsil" tugmasi chiqadi;
   *  berilmasa (landing), tugma shu sahifadagi ariza formasiga olib boradi. */
  href?: string;
}) {
  const t = useTranslations("Courses");
  const tLevel = useTranslations("Level");
  const locale = useLocale();
  const card = useRef<HTMLDivElement>(null);
  const accent = trackColor(trackOf(course.category.slug));

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const element = card.current;
    if (!element || event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    element.style.setProperty("--ry", `${(x - 0.5) * 2 * MAX_TILT_DEG}deg`);
    element.style.setProperty("--rx", `${(0.5 - y) * 2 * MAX_TILT_DEG}deg`);
  }

  function handlePointerLeave() {
    card.current?.style.setProperty("--rx", "0deg");
    card.current?.style.setProperty("--ry", "0deg");
  }

  const chips = [
    tLevel(course.level),
    course.duration_hours ? t("hours", { count: course.duration_hours }) : null,
  ].filter((chip): chip is string => Boolean(chip));
  const mentors = course.instructors.map((instructor) => instructor.full_name).join(", ");
  const price = primaryPrice(course, locale, {
    free: t("free"),
    price: (value) => t("price", { price: value }),
    once: t("once"),
    monthly: t("monthly"),
  });

  return (
    <article
      aria-labelledby={`course-${course.slug}`}
      className="group h-full [perspective:1400px]"
      style={{ "--track": accent, "--spot": accent } as CSSProperties}
    >
      <div
        ref={card}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        data-spotlight
        className="course-card"
      >
        <div data-play className="course-card__preview">
          {course.cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- ochiq S3 rasmi, o'lchami ma'lum emas
            <img src={course.cover} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <CoursePreview icon={course.icon} />
          )}
          <span className="course-card__track">{trackLabel}</span>
          <span title={t("videoLanguage")} className="course-card__lang">
            {course.video_language}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <h3
            id={`course-${course.slug}`}
            className="font-display text-xl leading-snug font-bold tracking-tight text-balance sm:text-2xl"
          >
            {href ? (
              // Havola butun kartochkani qoplaydi (course-card__link::after), lekin nomi — sarlavha.
              <Link href={href} className="course-card__link">
                {course.title}
              </Link>
            ) : (
              course.title
            )}
          </h3>
          {course.short_description && (
            <p className="mt-3 text-pretty text-muted-foreground">{course.short_description}</p>
          )}
          <ul className="mt-5 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={chip} className="course-card__chip">
                {chip}
              </li>
            ))}
          </ul>
          {mentors && <p className="mt-4 text-sm text-muted-foreground">{mentors}</p>}

          <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-7">
            <span className="font-mono text-lg font-medium">
              {price.amount}
              {price.unit && (
                <span className="ml-1.5 font-sans text-xs text-muted-foreground">{price.unit}</span>
              )}
            </span>
            {href ? (
              <span aria-hidden className="course-card__cta">
                {t("details")}
                <ArrowRight className="size-4" />
              </span>
            ) : (
              <a
                href={`#${CONTACT_SECTION}`}
                aria-describedby={`course-${course.slug}`}
                onClick={(event) => {
                  event.preventDefault();
                  selectCourseForLead(course.slug);
                }}
                className="course-card__cta"
              >
                {t("enroll")}
                <ArrowRight aria-hidden className="size-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
