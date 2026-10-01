import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

import { Emphasis } from "./emphasis";

import "./heading.css";

/** Paydo bo'lish navbati (ms): `data-reveal` elementlari uchun. */
export function delay(ms: number): CSSProperties {
  return { "--reveal-delay": ms } as CSSProperties;
}

type HeadingProps = {
  /** Sarlavha id'si: bo'lim `aria-labelledby` orqali unga bog'lanadi. */
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
  /** Sahifaning asosiy sarlavhasi bo'lsa `h1` (masalan, katalog sahifasida). */
  as?: "h1" | "h2";
};

/** Bo'lim sarlavhasi: kichik yorliq, `*so'z*` ajratilgan sarlavha va izoh — navbat bilan chiqadi. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  subtitle,
  className,
  as: Heading = "h2",
}: HeadingProps) {
  return (
    <header className={cn("mb-12 max-w-2xl sm:mb-16", className)}>
      {eyebrow && (
        <p data-reveal className="eyebrow flex items-center gap-2.5">
          <span aria-hidden className="size-1.5 rounded-full bg-caret" />
          {eyebrow}
        </p>
      )}
      <Heading id={id} data-reveal style={delay(80)} className="section-title mt-4">
        <Emphasis text={title} />
      </Heading>
      {subtitle && (
        <p
          data-reveal
          style={delay(160)}
          className="mt-5 text-base text-pretty text-muted-foreground sm:text-lg"
        >
          {subtitle}
        </p>
      )}
    </header>
  );
}

type SectionProps = Omit<HeadingProps, "id"> & {
  id: string;
  children: React.ReactNode;
};

/** Oddiy landing bo'limi: sarlavha + mazmun. */
export function Section({ id, className, children, ...heading }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("relative py-24 sm:py-32", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading id={`${id}-title`} {...heading} />
        {children}
      </div>
    </section>
  );
}
