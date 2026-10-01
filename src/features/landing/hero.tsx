import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";

import { CONTACT_SECTION, QUIZ_SECTION } from "@/components/site/sections";
import { SKILLS } from "@/components/three/constellation";
import { HeroCanvas, type SkillLabel } from "@/components/three/hero-canvas";
import { Button } from "@/components/ui/button";
import type { SitePayload } from "@/lib/api/site";

import { Emphasis } from "./emphasis";

/** Kirish animatsiyasidagi navbat: har bir qator oldingisidan biroz keyin chiqadi. */
function step(index: number): CSSProperties {
  return { "--d": index } as CSSProperties;
}

export async function Hero({ site }: { site: SitePayload | null }) {
  const [t, tSkills, tStatus] = await Promise.all([
    getTranslations("Hero"),
    getTranslations("Skills"),
    getTranslations("Status"),
  ]);
  const title = site?.settings.hero_title || t("titleFallback");
  const subtitle = site?.settings.hero_subtitle || t("subtitleFallback");
  const skills: SkillLabel[] = SKILLS.map((skill) => ({
    id: skill.id,
    track: skill.track,
    label: tSkills(skill.id),
  }));

  // Faqat haqiqiy raqamlar: nol bo'lsa ko'rsatilmaydi.
  const stats = site?.settings.sections.stats ? site.stats : null;
  const facts = [
    stats?.courses ? tStatus("courses", { count: stats.courses }) : null,
    stats?.instructors ? tStatus("instructors", { count: stats.instructors }) : null,
    stats?.lessons ? tStatus("lessons", { count: stats.lessons }) : null,
    stats?.students ? tStatus("students", { count: stats.students }) : null,
    tStatus("languages"),
    tStatus("payment"),
  ].filter((fact): fact is string => Boolean(fact));

  return (
    <section aria-labelledby="hero-title" className="hero relative isolate overflow-hidden">
      {/* Faqat fon animatsiyasi to'xtaydi: sarlavhaning kirish animatsiyasi JS'ni kutmaydi. */}
      <div aria-hidden data-play className="hero-backdrop" />
      <HeroCanvas skills={skills} hint={t("hint")} />

      <div className="relative mx-auto flex min-h-svh max-w-7xl flex-col justify-end px-4 pt-[max(46svh,19rem)] pb-10 sm:px-6 lg:justify-center lg:pt-28 lg:pb-24">
        <div className="max-w-xl lg:max-w-[min(36rem,44vw)]">
          <p className="hero-in hero-chip" style={step(0)}>
            <span aria-hidden className="hero-chip__dot" />
            {t("eyebrow")}
          </p>

          <h1 id="hero-title" className="hero-in hero-title mt-6" style={step(1)}>
            <Emphasis text={title} />
          </h1>

          <p
            className="hero-in mt-6 max-w-lg text-base text-pretty text-muted-foreground sm:text-lg"
            style={step(2)}
          >
            {subtitle}
          </p>

          <div
            className="hero-in mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
            style={step(3)}
          >
            <Button
              asChild
              size="lg"
              data-magnetic
              className="h-13 gap-2 rounded-full px-7 text-base shadow-[0_12px_32px_-12px_var(--caret)]"
            >
              <a href={`#${CONTACT_SECTION}`}>
                {t("primaryCta")}
                <ArrowRight aria-hidden className="size-5" />
              </a>
            </Button>
            <a href={`#${QUIZ_SECTION}`} className="quiz-cta">
              <span>{t("quizCta")}</span>
              <span className="quiz-cta__badge">{t("quizTime")}</span>
            </a>
          </div>

          <ul
            aria-label={tStatus("label")}
            className="hero-in mt-10 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-muted-foreground"
            style={step(4)}
          >
            {facts.map((fact) => (
              <li key={fact} className="flex items-center gap-2">
                <span aria-hidden className="size-1 rounded-full bg-line" />
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
