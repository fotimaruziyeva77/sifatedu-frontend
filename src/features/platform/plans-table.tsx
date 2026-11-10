import { Check } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { PublicPlan } from "@/lib/api/platform";

const SECTIONS = [
  "lessons",
  "exams",
  "placement",
  "rewards",
  "ai",
  "video",
  "bot",
  "click",
] as const;

/** Tariflar jurnal jadvali ko'rinishida: qatorda bo'lim, ustunda tarif. */
export async function PlansTable({ plans }: { plans: readonly PublicPlan[] }) {
  const [t, format] = await Promise.all([getTranslations("Platform"), getFormatter()]);

  const yes = (
    <>
      <Check aria-hidden className="pf-plans__yes" />
      <span className="sr-only">{t("included")}</span>
    </>
  );
  const no = (
    <>
      <span aria-hidden className="pf-plans__no">
        —
      </span>
      <span className="sr-only">{t("notIncluded")}</span>
    </>
  );
  const limit = (value: number | null | undefined, unit?: (count: number) => string) => {
    if (value === null || value === undefined) return t("unlimited");
    return unit ? unit(value) : format.number(value);
  };
  const group = (title: string) => (
    <tr className="pf-plans__group">
      <th colSpan={plans.length + 1} scope="colgroup">
        {title}
      </th>
    </tr>
  );

  return (
    <div className="pf-plans-wrap" tabIndex={0} role="region" aria-labelledby="plans-title">
      <table className="pf-plans">
        <thead>
          <tr>
            <td />
            {plans.map((plan) => (
              <th key={plan.id} scope="col">
                <span className="pf-plans__name">{plan.name}</span>
                <span className="pf-plans__price">
                  {plan.price > 0
                    ? t("pricePerMonth", { price: format.number(plan.price) })
                    : t("priceAsk")}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {group(t("groupBase"))}
          {[t("rowBase"), t("rowSite")].map((label) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {plans.map((plan) => (
                <td key={plan.id}>{yes}</td>
              ))}
            </tr>
          ))}
          {group(t("groupSections"))}
          {SECTIONS.map((section) => (
            <tr key={section}>
              <th scope="row">{t(`section.${section}`)}</th>
              {plans.map((plan) => (
                <td key={plan.id}>{plan.features.includes(section) ? yes : no}</td>
              ))}
            </tr>
          ))}
          {group(t("groupLimits"))}
          <tr>
            <th scope="row">{t("limitStudents")}</th>
            {plans.map((plan) => (
              <td key={plan.id}>{limit(plan.max_students)}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">{t("limitStaff")}</th>
            {plans.map((plan) => (
              <td key={plan.id}>{limit(plan.max_staff)}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">{t("limitDisk")}</th>
            {plans.map((plan) => (
              <td key={plan.id}>{limit(plan.max_disk_gb, (count) => t("gb", { count }))}</td>
            ))}
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td />
            {plans.map((plan) => (
              <td key={plan.id}>
                <Link
                  href={{ pathname: "/signup", query: { plan: plan.id } }}
                  className="pf-btn pf-btn--small"
                  aria-label={t("openPlan", { plan: plan.name })}
                >
                  {t("open")}
                </Link>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
