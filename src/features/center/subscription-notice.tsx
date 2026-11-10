import { getTranslations } from "next-intl/server";

/** Xodimlarga: sinov yoki obuna tugayapti, yoki muhlatda. `days` manfiy — muddat o'tgan. */
export async function SubscriptionNotice({ days, trial }: { days: number; trial: boolean }) {
  const t = await getTranslations("Center");
  const key = trial ? "trialEndsIn" : "expiresIn";

  return (
    <p role="status" className="app-card mb-6 text-sm text-pretty">
      {days >= 0 ? t(key, { days }) : t(trial ? "trialEnded" : "expired")}
    </p>
  );
}
