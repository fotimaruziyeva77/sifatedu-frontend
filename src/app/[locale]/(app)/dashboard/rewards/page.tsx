import { ArrowRight, Coins, Medal, ShoppingBag, TicketPercent, Zap } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { HistoryList } from "@/features/rewards/history-list";
import { InviteCard } from "@/features/rewards/invite-card";
import { StreakTrail } from "@/features/rewards/streak-trail";
import { TaskList } from "@/features/rewards/task-list";
import { Link } from "@/i18n/navigation";
import { getRewards } from "@/lib/api/rewards";
import { formatNumber } from "@/lib/format";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/rewards">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Rewards" });
  return { title: t("title"), robots: { index: false } };
}

/**
 * Yutuqlar: XP (reyting uchun), coin (do'kon uchun), seriya, bugungi topshiriqlar, do'stni
 * taklif qilish, tarix va "qanday topiladi". XP va coin faqat saytda ko'rinadi.
 */
export default async function RewardsPage({ params }: PageProps<"/[locale]/dashboard/rewards">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, rewards] = await Promise.all([getTranslations("Rewards"), getRewards(locale)]);
  if (!rewards) notFound();
  const rules = rewards.rules;
  const done = rewards.tasks.filter((task) => task.done).length;

  return (
    <>
      <header>
        <h1 className="app-title">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{t("intro")}</p>
      </header>

      <section aria-label={t("balance")} className="rw-balance">
        <div className="rw-stat">
          <span aria-hidden className="rw-stat__icon" data-kind="xp">
            <Zap className="size-5" />
          </span>
          <p className="rw-stat__value">{formatNumber(rewards.xp, locale)}</p>
          <p className="rw-stat__label">{t("xp")}</p>
          <Link href="/dashboard/rating" className="rw-stat__link">
            <Medal aria-hidden className="size-4" />
            {t("toRating")}
          </Link>
        </div>
        <div className="rw-stat">
          <span aria-hidden className="rw-stat__icon" data-kind="coins">
            <Coins className="size-5" />
          </span>
          <p className="rw-stat__value">{formatNumber(rewards.coins, locale)}</p>
          <p className="rw-stat__label">{t("coins")}</p>
          <Link href="/dashboard/shop" className="rw-stat__link">
            <ShoppingBag aria-hidden className="size-4" />
            {t("coinsHint")}
          </Link>
        </div>
        <div className="rw-stat rw-stat--streak">
          <p className="rw-stat__value">{t("streakDays", { count: rewards.streak })}</p>
          <p className="rw-stat__label">{t("streak")}</p>
          <StreakTrail
            streak={rewards.streak}
            label={t("streakLabel", { count: rewards.streak, best: rewards.best_streak })}
          />
          <p className="rw-stat__hint">{t("bestStreak", { count: rewards.best_streak })}</p>
        </div>
      </section>

      <section aria-labelledby="rw-today" className="app-card mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="rw-today" className="app-section-title">
            {t("todayTitle")}
          </h2>
          {rewards.tasks.length > 0 && (
            <p className="text-sm text-muted-foreground tabular-nums">
              {t("todayCount", { done, total: rewards.tasks.length })}
            </p>
          )}
        </div>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">
          {t("todayHint", { bonus: rules.daily_bonus_xp, penalty: rules.daily_missed_penalty })}
        </p>
        <div className="mt-4">
          <TaskList tasks={rewards.tasks} />
        </div>
      </section>

      <section aria-labelledby="rw-invite" className="app-card mt-6">
        <h2 id="rw-invite" className="app-section-title">
          {t("inviteTitle")}
        </h2>
        <p className="mt-1 text-pretty text-muted-foreground">
          {t("inviteText", {
            lesson: rules.referral_lesson_coins,
            paid: rules.referral_paid_coins,
            coupon: rules.coupon_percent,
            discount: rules.referral_discount,
          })}
        </p>
        <div className="mt-4">
          <InviteCard
            siteUrl={rewards.invite_url}
            botUrl={rewards.invite_bot_url}
            invited={rewards.invited}
          />
        </div>
        {rewards.coupons.length > 0 && (
          <ul className="rw-coupons">
            {rewards.coupons.map((coupon) => (
              <li key={coupon.id}>
                <TicketPercent aria-hidden className="size-5 shrink-0" />
                <span>
                  {t(coupon.reserved ? "couponReserved" : "coupon", { percent: coupon.percent })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="rw-history" className="mt-10">
        <h2 id="rw-history" className="app-section-title">
          {t("historyTitle")}
        </h2>
        <div className="mt-4">
          <HistoryList initial={rewards.history} />
        </div>
      </section>

      <details className="rw-rules mt-10">
        <summary>{t("rulesTitle")}</summary>
        <div className="rw-rules__grid">
          <div>
            <h3>{t("rulesEarn")}</h3>
            <ul>
              <li>{t("rule.lesson", { value: rules.lesson_xp })}</li>
              <li>{t("rule.quiz", { value: rules.quiz_xp })}</li>
              <li>{t("rule.homework", { value: rules.homework_xp })}</li>
              <li>{t("rule.attendance", { value: rules.attendance_xp })}</li>
              <li>{t("rule.exam", { value: rules.exam_xp })}</li>
              <li>{t("rule.daily", { value: rules.daily_bonus_xp })}</li>
            </ul>
          </div>
          <div>
            <h3>{t("rulesLose")}</h3>
            <ul>
              <li>{t("rule.dailyMissed", { value: rules.daily_missed_penalty })}</li>
              <li>{t("rule.absent", { value: rules.absent_penalty })}</li>
              <li>{t("rule.late", { value: rules.late_penalty })}</li>
              <li>{t("rule.homeworkLate", { value: rules.homework_late_penalty })}</li>
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">{t("rulesNote")}</p>
          </div>
        </div>
        <Link href="/dashboard/rating" className="rw-rules__link">
          {t("toRating")}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </details>
    </>
  );
}
