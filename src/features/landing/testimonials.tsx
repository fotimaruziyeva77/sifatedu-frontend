import { getTranslations } from "next-intl/server";

import type { SitePayload } from "@/lib/api/site";
import { initials } from "@/lib/format";

import { SectionHeading } from "./section";

/** Ijtimoiy isbot: faqat haqiqiy fikrlar. Uchtadan ko'p bo'lsa — cheksiz lenta. */
export async function Testimonials({ items }: { items: SitePayload["testimonials"] }) {
  const t = await getTranslations("Testimonials");
  if (items.length === 0) return null;
  const marquee = items.length >= 3;
  // Lenta uzluksiz aylanishi uchun ro'yxat ikki marta chiziladi (ikkinchisi ekran o'quvchidan yashirin).
  const cards = marquee ? [...items, ...items] : items;

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-title"
      className="relative overflow-hidden py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading id="reviews-title" eyebrow={t("eyebrow")} title={t("title")} />
      </div>
      <div data-play className={marquee ? "marquee" : "mx-auto max-w-7xl px-4 sm:px-6"}>
        <ul className={marquee ? "marquee__track" : "grid gap-5 md:grid-cols-2"}>
          {cards.map((item, index) => (
            <li
              key={`${item.id}-${index}`}
              aria-hidden={index >= items.length || undefined}
              className="review-card"
            >
              <figure className="flex h-full flex-col">
                <blockquote className="text-pretty">“{item.text}”</blockquote>
                <figcaption className="mt-auto flex items-center gap-3 pt-6">
                  {item.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element -- ochiq S3 rasmi
                    <img
                      src={item.avatar}
                      alt=""
                      loading="lazy"
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="flex size-10 items-center justify-center rounded-full bg-secondary font-mono text-xs"
                    >
                      {initials(item.author_name)}
                    </span>
                  )}
                  <span>
                    <span className="block font-semibold">{item.author_name}</span>
                    {item.author_role && (
                      <span className="block text-sm text-muted-foreground">
                        {item.author_role}
                      </span>
                    )}
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
