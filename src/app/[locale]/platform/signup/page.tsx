import { getTranslations, setRequestLocale } from "next-intl/server";

import { SignupFlow } from "@/features/platform/signup-flow";
import { TopBar } from "@/features/platform/top-bar";
import { getCenter, unavailable } from "@/lib/api/center";
import { getPlans, trialDays } from "@/lib/api/platform";

export const dynamic = "force-dynamic";

/** Markazni ochish: forma → SMS kod → tayyorlanmoqda → kabinetga kirish. */
export default async function SignupPage({
  params,
  searchParams,
}: PageProps<"/[locale]/platform/signup">) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const center = await getCenter();
  // Asosiy layout o'z sahifasini ko'rsatadi; bu sahifa esa baribir alohida yig'iladi, shuning
  // uchun bu yerdan hech narsa chiqmasligi kerak.
  if (unavailable(center)) return null;
  const [t, plans] = await Promise.all([getTranslations("Platform"), getPlans()]);
  const wanted = Number(query.plan);
  const initialPlan = plans.find((plan) => plan.id === wanted)?.id ?? plans[0]?.id;

  return (
    <div className="pf-page">
      <TopBar name={center.name} sections={false} />
      <main className="pf-form-page">
        <div className="pf-sheet">
          <SignupFlow
            plans={plans.map((plan) => ({ id: plan.id, name: plan.name }))}
            initialPlan={initialPlan}
            baseDomain={center.base_domain}
            title={t("signupTitle")}
            text={t("signupText", { days: trialDays(plans) })}
          />
        </div>
      </main>
    </div>
  );
}
