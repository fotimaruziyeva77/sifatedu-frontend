import { getTranslations } from "next-intl/server";

import type { SitePayload } from "@/lib/api/site";
import { cn } from "@/lib/utils";

import { BenefitVisual } from "./benefit-visual";
import { delay, Section } from "./section";

/** "Har bir kursda" — foydalar bento plitkalarida, har birida mini-animatsiya. */
export async function Benefits({ items }: { items: SitePayload["advantages"] }) {
  const t = await getTranslations("Benefits");
  if (items.length === 0) return null;

  return (
    <Section id="benefits" eyebrow={t("eyebrow")} title={t("title")} subtitle={t("text")}>
      <ul className="bento">
        {items.map((item, index) => (
          <li
            key={item.id}
            data-reveal
            data-spotlight
            data-play
            style={delay((index % 3) * 80)}
            // Keng va tor plitkalar navbatlashadi: 2+1, 1+2, ...
            className={cn("bento-tile", (index % 4 === 0 || index % 4 === 3) && "bento-tile--wide")}
          >
            <BenefitVisual icon={item.icon} />
            <h3 className="mt-6 font-display text-xl font-bold tracking-tight">{item.title}</h3>
            {item.text && <p className="mt-2 text-pretty text-muted-foreground">{item.text}</p>}
          </li>
        ))}
      </ul>
    </Section>
  );
}
