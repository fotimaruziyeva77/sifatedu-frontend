import { ArrowRight, Coins, Flame, Zap } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Rewards } from "@/lib/api/rewards";
import { formatNumber } from "@/lib/format";

import { TaskList } from "./task-list";

/** Kabinet bosh sahifasida: XP, coin, seriya va bugungi topshiriqlar (qisqa). */
export async function RewardsCard({ rewards }: { rewards: Rewards }) {
  const [t, locale] = await Promise.all([getTranslations("Rewards"), getLocale()]);
  const done = rewards.tasks.filter((task) => task.done).length;

  return (
    <section aria-labelledby="rewards-card" className="app-card rw-card mt-8">
      <div className="rw-card__head">
        <h2 id="rewards-card" className="app-section-title">
          {t("cardTitle")}
        </h2>
        <Link href="/dashboard/rewards" className="rw-card__link">
          {t("cardMore")}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
      <dl className="rw-card__stats">
        <div>
          <dt>
            <Zap aria-hidden className="size-4" />
            {t("xp")}
          </dt>
          <dd>{formatNumber(rewards.xp, locale)}</dd>
        </div>
        <div>
          <dt>
            <Coins aria-hidden className="size-4" />
            {t("coins")}
          </dt>
          <dd>{formatNumber(rewards.coins, locale)}</dd>
        </div>
        <div>
          <dt>
            <Flame aria-hidden className="size-4" />
            {t("streak")}
          </dt>
          <dd>{t("streakDays", { count: rewards.streak })}</dd>
        </div>
      </dl>
      {rewards.tasks.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            {t("todayCount", { done, total: rewards.tasks.length })}
          </p>
          <div className="mt-2">
            <TaskList tasks={rewards.tasks} />
          </div>
        </div>
      )}
    </section>
  );
}
