import { getTranslations } from "next-intl/server";

import { NetworkField } from "@/components/site/network-field";
import type { SitePayload } from "@/lib/api/site";

import { delay, SectionHeading } from "./section";

/** "Sizga ham tanishmi?" — odamni to'xtatadigan xavotir va unga javob (empatiya). */
export async function Concerns({ items }: { items: SitePayload["concerns"] }) {
  const t = await getTranslations("Concerns");
  if (items.length === 0) return null;

  return (
    <section
      id="concerns"
      aria-labelledby="concerns-title"
      className="relative isolate overflow-hidden py-24 sm:py-32"
    >
      <NetworkField className="-z-10 opacity-80" density={0.9} />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            id="concerns-title"
            eyebrow={t("eyebrow")}
            title={t("title")}
            subtitle={t("text")}
            className="mb-0"
          />
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              data-reveal
              data-spotlight
              style={delay((index % 2) * 90)}
              className="concern-card"
            >
              <p className="concern-card__problem">“{item.problem}”</p>
              <span aria-hidden className="concern-card__link" />
              <p className="concern-card__answer">
                <span className="sr-only">{t("answer")}: </span>
                {item.answer}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
