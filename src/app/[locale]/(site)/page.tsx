import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { About } from "@/features/landing/about";
import { Benefits } from "@/features/landing/benefits";
import { Concerns } from "@/features/landing/concerns";
import { Courses } from "@/features/landing/courses";
import { Hero } from "@/features/landing/hero";
import { PathSection } from "@/features/landing/path";
import { Testimonials } from "@/features/landing/testimonials";
import { Trust } from "@/features/landing/trust";
import { LeadSection } from "@/features/leads/lead-section";
import { getCenter } from "@/lib/api/center";
import { getSite, type SitePayload } from "@/lib/api/site";
import { siteOrigin } from "@/lib/site-origin";

import "./landing.css";
import "./sections.css";

// Kontent admin paneldan o'zgaradi; backend javobni Redis'da keshlaydi.
export const dynamic = "force-dynamic";

/**
 * Landing — hikoya: orzu (hero) → xavotirlar → yo'lboshchi (biz kimmiz) → reja (yo'l) →
 * taklif (kurslar, kasb testi) → foyda → ijtimoiy isbot → e'tirozlarga javob → birinchi qadam.
 */
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [site, center] = await Promise.all([getSite(locale), getCenter()]);
  const { flagship } = center;

  // Har bir bo'lim <Suspense> ichida: HTML o'zgarmaydi, lekin React sahifani bitta uzun
  // vazifada emas, bo'lim-bo'lim gidratsiya qiladi va oraliqda brauzerga navbat beradi —
  // birinchi ekran tezroq javob beradi (TBT/INP).
  return (
    <>
      <OrganizationJsonLd site={site} locale={locale} />
      <Hero site={site} flagship={flagship} name={center.name} />
      {site && (
        <>
          <Suspense>
            <Concerns items={site.concerns} />
          </Suspense>
          <Suspense>
            <About site={site} flagship={flagship} />
          </Suspense>
          <Suspense>
            <PathSection steps={site.steps} />
          </Suspense>
          <Suspense>
            <Courses
              courses={site.featured_courses}
              assistant={site.settings.assistant_enabled}
              flagship={flagship}
            />
          </Suspense>
          <Suspense>
            <Benefits items={site.advantages} />
          </Suspense>
          {site.settings.sections.testimonials && (
            <Suspense>
              <Testimonials items={site.testimonials} />
            </Suspense>
          )}
          <Suspense>
            <Trust site={site} flagship={flagship} />
          </Suspense>
        </>
      )}
      <Suspense>
        <LeadSection site={site} />
      </Suspense>
    </>
  );
}

async function OrganizationJsonLd({ site, locale }: { site: SitePayload | null; locale: string }) {
  const [t, center, origin] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata" }),
    getCenter(),
    siteOrigin(),
  ]);
  const settings = site?.settings;
  const logo = center.flagship ? `${origin}/brand/logo.svg` : center.logo;
  const description = center.flagship ? t("description") : settings?.hero_subtitle;
  const data = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: center.name,
    url: `${origin}/${locale}`,
    ...(logo && { logo }),
    ...(description && { description }),
    ...(settings?.phone && {
      contactPoint: {
        "@type": "ContactPoint",
        telephone: settings.phone,
        contactType: "customer service",
      },
    }),
    sameAs: settings ? Object.values(settings.socials).filter(Boolean) : [],
  };

  return (
    <script
      type="application/ld+json"
      // JSON ichidagi "<" belgisi script tegini yopib qo'ymasligi uchun ekranlanadi.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
