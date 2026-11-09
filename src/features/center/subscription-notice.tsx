import { getTranslations } from "next-intl/server";

/** Xodimlarga: obuna tugayapti yoki muhlatda. `days` manfiy — muddat o'tgan. */
export async function SubscriptionNotice({ days }: { days: number }) {
  const t = await getTranslations("Center");

  return (
    <p role="status" className="app-card mb-6 text-sm text-pretty">
      {days >= 0 ? t("expiresIn", { days }) : t("expired")}
    </p>
  );
}
