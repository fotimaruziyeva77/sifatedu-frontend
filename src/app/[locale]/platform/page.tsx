import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { Journal } from "@/features/platform/journal";
import { PlansTable } from "@/features/platform/plans-table";
import { TopBar } from "@/features/platform/top-bar";
import { Link } from "@/i18n/navigation";
import { getCenter, unavailable } from "@/lib/api/center";
import { getPlans, trialDays } from "@/lib/api/platform";

export const dynamic = "force-dynamic";

const FEATURES = ["site", "groups", "lessons", "bot", "payments", "ai"] as const;
const STEPS = ["one", "two", "three"] as const;

/** Qo'lda chizilgan chiziq: ruchka harakatidagi kichik notekislik bilan. */
function Stroke({ d }: { d: string }) {
  return (
    <svg aria-hidden viewBox="0 0 200 20" preserveAspectRatio="none">
      <path d={d} pathLength={1} />
    </svg>
  );
}

/** Bosh sahifa: markaz egasini «Markazni ochish» tugmasiga olib boradi. */
export default async function PlatformHomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const center = await getCenter();
  // Asosiy layout o'z sahifasini ko'rsatadi; bu sahifa esa baribir alohida yig'iladi, shuning
  // uchun bu yerdan hech narsa chiqmasligi kerak.
  if (unavailable(center)) return null;
  const [t, plans] = await Promise.all([getTranslations("Platform"), getPlans()]);
  const days = trialDays(plans);

  return (
    <div className="pf-page">
      <TopBar name={center.name} />

      <main>
        <section className="pf-hero">
          <div>
            <p className="pf-kicker">{t("kicker")}</p>
            <h1>
              {t.rich("heroTitle", {
                struck: (chunks: ReactNode) => (
                  <span className="pf-struck">
                    {chunks}
                    <Stroke d="M2 12 C 40 5, 78 15, 118 9 S 176 6, 198 11" />
                  </span>
                ),
                tool: (chunks: ReactNode) => (
                  <span className="pf-tool">
                    {chunks}
                    <Stroke d="M3 9 C 48 15, 110 3, 197 10" />
                  </span>
                ),
              })}
            </h1>
            <p className="pf-lead">{t("heroText", { days })}</p>
            <div className="pf-actions">
              <Link href="/signup" className="pf-btn">
                {t("open")}
                <ArrowRight aria-hidden className="size-5" />
              </Link>
              <a href="#plans" className="pf-link">
                {t("heroPlans")}
              </a>
            </div>
            <p className="pf-note">{t("heroNote")}</p>
          </div>
          <Journal group={t("journalGroup")} test={t("journalTest")} />
        </section>

        <section id="features" className="pf-section" aria-labelledby="features-title">
          <h2 id="features-title">{t("featuresTitle")}</h2>
          <ul className="pf-lines">
            {FEATURES.map((key) => (
              <li key={key}>
                <h3>{t(`features.${key}.title`)}</h3>
                <p>{t(`features.${key}.text`)}</p>
              </li>
            ))}
          </ul>
        </section>

        {plans.length > 0 && (
          <section id="plans" className="pf-section" aria-labelledby="plans-title">
            <h2 id="plans-title">{t("plansTitle")}</h2>
            <p className="pf-section__text">{t("plansText", { days })}</p>
            <PlansTable plans={plans} />
          </section>
        )}

        <section className="pf-section" aria-labelledby="steps-title">
          <h2 id="steps-title">{t("stepsTitle")}</h2>
          <ol className="pf-steps">
            {STEPS.map((key) => (
              <li key={key}>
                <h3>{t(`steps.${key}.title`)}</h3>
                <p>{t(`steps.${key}.text`)}</p>
              </li>
            ))}
          </ol>
          <div className="pf-actions">
            <Link href="/signup" className="pf-btn">
              {t("open")}
              <ArrowRight aria-hidden className="size-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="pf-foot">
        <span>{t("rights", { year: new Date().getFullYear(), name: center.name })}</span>
        <span>
          {center.support_phone && (
            <a href={`tel:${center.support_phone.replace(/[^\d+]/g, "")}`}>
              {center.support_phone}
            </a>
          )}
        </span>
      </footer>
    </div>
  );
}
