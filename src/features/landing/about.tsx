import { getTranslations } from "next-intl/server";

import type { SitePayload } from "@/lib/api/site";

import { Instructors } from "./instructors";
import { Manifesto } from "./manifesto";
import { MotionReel } from "./motion-reel";
import { PromoVideo } from "./promo-video";
import { delay, SectionHeading } from "./section";

/** "Biz kimmiz" — yo'lboshchi: manifest, video (yoki rolik) va ustozlar. */
export async function About({ site, flagship }: { site: SitePayload; flagship: boolean }) {
  const t = await getTranslations("About");
  const { settings } = site;
  const manifesto = settings.about_text || (flagship ? t("manifestoFallback") : "");
  const instructors = settings.sections.instructors && site.instructors.length > 0;
  // Yangi markazda matn va video bo'lmasligi mumkin: bo'sh bo'lim ko'rsatilmaydi.
  if (!flagship && !manifesto && !settings.promo_video && !instructors) return null;

  return (
    <section id="about" aria-labelledby="about-title" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading id="about-title" eyebrow={t("eyebrow")} title={t("title")} />

        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          {manifesto && <Manifesto text={manifesto} />}
          {(settings.promo_video || flagship) && (
            <div data-reveal style={delay(120)}>
              {settings.promo_video ? (
                <PromoVideo
                  src={settings.promo_video}
                  poster={settings.promo_poster}
                  label={t("video")}
                  playLabel={t("play")}
                />
              ) : (
                <MotionReel />
              )}
            </div>
          )}
        </div>

        {settings.sections.instructors && <Instructors instructors={site.instructors} />}
      </div>
    </section>
  );
}
