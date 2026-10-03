import { ArrowRight, CalendarCheck, Send } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { DailyStrip } from "@/features/daily-test/daily-strip";
import { Link } from "@/i18n/navigation";
import { getDailyTest, type DailyGroup, type DailyRow } from "@/lib/api/daily-test";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/daily-test">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DailyTest" });
  return { title: t("title"), robots: { index: false } };
}

const MEDALS = ["🥇", "🥈", "🥉"];

type T = Awaited<ReturnType<typeof getTranslations<"DailyTest">>>;

/** Reyting ro'yxati (kunlik yoki haftalik): o'rin, ism, to'g'ri javoblar. */
function Board({ rows, t }: { rows: DailyRow[]; t: T }) {
  if (rows.length === 0) return <p className="mt-3 text-muted-foreground">{t("ratingEmpty")}</p>;
  return (
    <ol className="rt-board mt-2">
      {rows.map((row, index) => (
        <li key={`${index}-${row.name}`} data-me={row.me ? "" : undefined}>
          <span className="rt-board__place">
            {index < 3 ? (
              <span role="img" aria-label={t("place", { place: index + 1 })}>
                {MEDALS[index]}
              </span>
            ) : (
              index + 1
            )}
          </span>
          <span className="rt-board__name">
            {row.name}
            {row.me && <span className="rt-board__you">{t("you")}</span>}
          </span>
          <span className="rt-board__xp">
            {row.correct}/{row.total}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Kunlik test: guruh bo'yicha bugungi holat (ishlash — Telegram botda), kunlik va haftalik
 * reyting, oxirgi natijalar. To'g'ri javoblar va izohlar — test yopilgach (23:00).
 */
export default async function DailyTestPage({
  params,
}: PageProps<"/[locale]/dashboard/daily-test">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, format, data] = await Promise.all([
    getTranslations("DailyTest"),
    getFormatter(),
    getDailyTest(locale),
  ]);
  if (!data) notFound();
  const time = (value: string) =>
    format.dateTime(new Date(value), { hour: "2-digit", minute: "2-digit" });
  // Kun ("2026-10-05") — kun o'rtasi bilan: vaqt mintaqasi sanani surib yubormasin.
  const day = (value: string) =>
    format.dateTime(new Date(`${value}T12:00:00Z`), { day: "numeric", month: "long" });

  const empty = !data.enabled ? t("disabled") : data.groups.length === 0 ? t("noGroup") : null;

  const today = (group: DailyGroup) => {
    const test = group.today;
    if (!test) return <p className="text-pretty text-muted-foreground">{t("todayNone")}</p>;
    const attempt = test.attempt;
    if (attempt?.finished) {
      return (
        <div className="daily-result">
          <p className="daily-result__score">
            <span className="sr-only">{t("todayDone")}: </span>
            {attempt.correct}
            <span className="daily-result__total">/{attempt.total}</span>
          </p>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {t("rightWrong", { right: attempt.correct, wrong: attempt.total - attempt.correct })}
            </p>
            <DailyStrip
              correct={attempt.correct}
              total={attempt.total}
              label={t("stripLabel", { right: attempt.correct, total: attempt.total })}
            />
            {attempt.reviewable ? (
              <Link href={`/dashboard/daily-test/${attempt.id}`} className="rw-stat__link">
                {t("seeAnswers")}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                {t("answersAt", { time: time(test.closes_at) })}
              </p>
            )}
          </div>
        </div>
      );
    }
    if (!test.open) return <p className="text-muted-foreground">{t("todayClosed")}</p>;
    return (
      <div className="daily-open">
        <p className="text-pretty">
          {attempt
            ? t("todayStarted", { time: time(test.closes_at) })
            : t("todayOpen", { count: test.questions_count, time: time(test.closes_at) })}
        </p>
        {data.bot_url ? (
          <Button asChild className="h-11 gap-2 rounded-full px-5">
            <a href={data.bot_url} target="_blank" rel="noopener">
              <Send aria-hidden className="size-4" />
              {attempt ? t("continueInBot") : t("openInBot")}
            </a>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">{t("botMissing")}</p>
        )}
      </div>
    );
  };

  return (
    <>
      <header>
        <h1 className="app-title">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{t("intro")}</p>
      </header>

      {empty ? (
        <div className="app-empty mt-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-caret">
            <CalendarCheck aria-hidden className="size-6" />
          </span>
          <p className="max-w-lg text-pretty text-muted-foreground">{empty}</p>
        </div>
      ) : (
        data.groups.map((group) => (
          <section key={group.id} aria-labelledby={`daily-${group.id}`} className="mt-8">
            <h2 id={`daily-${group.id}`} className="app-section-title">
              {group.name}{" "}
              <span className="font-normal text-muted-foreground">· {group.course}</span>
            </h2>

            <div className="app-card daily-today mt-4">
              <p className="daily-today__label">
                {t("today")}
                {group.today && <span> · {day(group.today.day)}</span>}
              </p>
              {today(group)}
            </div>

            <div className="daily-boards mt-6">
              <section aria-labelledby={`daily-day-${group.id}`} className="app-card">
                <h3 id={`daily-day-${group.id}`} className="app-section-title">
                  {t("dayTitle")}
                </h3>
                <Board rows={group.day_rating} t={t} />
              </section>
              <section aria-labelledby={`daily-week-${group.id}`} className="app-card">
                <h3 id={`daily-week-${group.id}`} className="app-section-title">
                  {t("weekTitle")}
                </h3>
                <Board rows={group.week_rating} t={t} />
              </section>
            </div>

            <section aria-labelledby={`daily-history-${group.id}`} className="app-card mt-6">
              <h3 id={`daily-history-${group.id}`} className="app-section-title">
                {t("historyTitle")}
              </h3>
              {group.history.length === 0 ? (
                <p className="mt-3 text-muted-foreground">{t("historyEmpty")}</p>
              ) : (
                <ol className="daily-history mt-3">
                  {group.history.map((item) => (
                    <li key={item.attempt_id}>
                      <span className="daily-history__day">{day(item.day)}</span>
                      <span className="daily-history__score">
                        {item.correct}/{item.total}
                      </span>
                      {item.reviewable ? (
                        <Link
                          href={`/dashboard/daily-test/${item.attempt_id}`}
                          className="rw-stat__link"
                        >
                          {t("answers")}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">{t("answersLater")}</span>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </section>
        ))
      )}
    </>
  );
}
