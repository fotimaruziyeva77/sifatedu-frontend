import { Compass, MessageCircle, PlayCircle, Sparkles, Trophy } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createElement } from "react";

import type { SitePayload } from "@/lib/api/site";

import { PathTrack } from "./path-track";
import { Section } from "./section";

/** Qadamlar tartibi bo'yicha belgi: suhbat → tanlov → o'qish → natija. */
const STEP_ICONS = [MessageCircle, Compass, PlayCircle, Trophy];

/** "Qanday o'qiymiz" — aniq reja: noaniqlik qo'rquvini kamaytiradi. */
export async function PathSection({ steps }: { steps: SitePayload["steps"] }) {
  const t = await getTranslations("Path");
  if (steps.length === 0) return null;

  return (
    <Section id="path" eyebrow={t("eyebrow")} title={t("title")} subtitle={t("text")}>
      <PathTrack>
        {steps.map((step, index) => (
          <li key={step.id} data-step className="path-step">
            <span aria-hidden data-node className="path-step__node">
              {createElement(STEP_ICONS[index] ?? Sparkles, { className: "size-5" })}
            </span>
            <div data-reveal className="path-step__card">
              <p className="eyebrow">{t("step", { number: index + 1 })}</p>
              <h3 className="mt-3 font-display text-xl font-bold tracking-tight sm:text-2xl">
                {step.title}
              </h3>
              {step.text && <p className="mt-3 text-pretty text-muted-foreground">{step.text}</p>}
            </div>
          </li>
        ))}
      </PathTrack>
    </Section>
  );
}
