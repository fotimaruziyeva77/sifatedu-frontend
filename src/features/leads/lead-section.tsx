import { Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { NetworkField } from "@/components/site/network-field";
import { CONTACT_SECTION } from "@/components/site/sections";
import { delay, SectionHeading } from "@/features/landing/section";
import type { SitePayload } from "@/lib/api/site";

import { LeadForm } from "./lead-form";

type CourseOption = { slug: string; title: string };

/**
 * Yakuniy CTA: kichik majburiyat — bepul suhbat. Kurs sahifasida ham ishlatiladi, shuning uchun
 * o'sha kurs ro'yxatda bo'lmasa, `course` orqali qo'shiladi.
 */
export async function LeadSection({
  site,
  course,
}: {
  site: SitePayload | null;
  course?: CourseOption;
}) {
  const t = await getTranslations("Lead");
  const featured = (site?.featured_courses ?? []).map(({ slug, title }) => ({ slug, title }));
  const courses =
    course && !featured.some((item) => item.slug === course.slug)
      ? [course, ...featured]
      : featured;
  const phone = site?.settings.phone;
  const steps = [t("next1"), t("next2"), t("next3")];

  return (
    <section
      id={CONTACT_SECTION}
      aria-labelledby="contact-title"
      className="relative isolate overflow-hidden py-24 sm:py-32"
    >
      <NetworkField className="-z-10" density={1.1} />
      <div aria-hidden className="lead-glow" />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <div>
          <SectionHeading
            id="contact-title"
            eyebrow={t("eyebrow")}
            title={t("title")}
            subtitle={t("text")}
            className="mb-10"
          />
          <h3 className="eyebrow">{t("nextTitle")}</h3>
          <ol className="lead-steps mt-5">
            {steps.map((step, index) => (
              <li key={step} data-reveal style={delay(index * 90)}>
                <span aria-hidden className="lead-steps__dot" />
                {step}
              </li>
            ))}
          </ol>

          {phone && (
            <div className="mt-12">
              <p className="text-sm text-muted-foreground">{t("orCall")}</p>
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                className="mt-2 inline-flex items-center gap-3 font-mono text-xl underline-offset-4 hover:underline"
              >
                <Phone aria-hidden className="size-5 text-caret" />
                {phone}
              </a>
            </div>
          )}
        </div>

        <div data-reveal style={delay(120)} className="lead-card">
          <LeadForm courses={courses} />
        </div>
      </div>
    </section>
  );
}
