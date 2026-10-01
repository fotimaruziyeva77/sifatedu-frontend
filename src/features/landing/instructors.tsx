import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";

import type { InstructorCard } from "@/lib/api/site";
import { initials } from "@/lib/format";

import { delay } from "./section";

/** Ustoz kartochkalari navbat bilan yo'nalish ranglarida bezaladi. */
const ACCENTS = ["frontend", "backend", "design", "basics"] as const;

const SOCIALS = [
  ["linkedin_url", "LinkedIn"],
  ["github_url", "GitHub"],
  ["telegram_url", "Telegram"],
] as const;

export async function Instructors({ instructors }: { instructors: readonly InstructorCard[] }) {
  const t = await getTranslations("About");
  if (instructors.length === 0) return null;

  return (
    <div className="mt-24 sm:mt-32">
      <h3 data-reveal className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        {t("instructorsTitle")}
      </h3>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {instructors.map((instructor, index) => {
          const accent = `var(--track-${ACCENTS[index % ACCENTS.length]})`;
          return (
            <li
              key={instructor.slug}
              data-reveal
              data-spotlight
              style={
                { ...delay(index * 90), "--spot": accent, "--accent": accent } as CSSProperties
              }
              className="mentor-card"
            >
              <div className="mentor-card__avatar">
                {instructor.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- ochiq S3 rasmi
                  <img src={instructor.photo} alt="" loading="lazy" />
                ) : (
                  <span aria-hidden>{initials(instructor.full_name)}</span>
                )}
              </div>
              <h4 className="mt-6 text-lg font-semibold">{instructor.full_name}</h4>
              {instructor.position && (
                <p className="mt-1 text-sm text-muted-foreground">{instructor.position}</p>
              )}
              {instructor.experience_years ? (
                <p className="mentor-card__chip">
                  {t("experience", { count: instructor.experience_years })}
                </p>
              ) : null}
              {instructor.bio && (
                <p className="mt-4 line-clamp-4 text-sm text-pretty text-muted-foreground">
                  {instructor.bio}
                </p>
              )}
              <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-6 text-sm">
                {SOCIALS.filter(([field]) => instructor[field]).map(([field, label]) => (
                  <li key={field}>
                    <a
                      href={instructor[field]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-4 hover:underline"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
