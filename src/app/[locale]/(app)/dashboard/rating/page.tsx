import { EyeOff, Medal } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getRating, type RatingPeriod } from "@/lib/api/rewards";
import { formatNumber } from "@/lib/format";

const PERIODS: RatingPeriod[] = ["week", "month", "all"];
const MEDALS = ["🥇", "🥈", "🥉"];

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/rating">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Rewards" });
  return { title: t("ratingTitle"), robots: { index: false } };
}

function pick<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
): T | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return allowed.find((item) => item === raw) ?? null;
}

/**
 * Reyting: haftalik, oylik va umumiy; kurs yoki guruh bo'yicha. Eng yaxshi 10 ta va o'z o'rni
 * (reytingda ko'rinmaslikni tanlagan o'quvchi ham o'z o'rnini ko'radi).
 */
export default async function RatingPage({
  params,
  searchParams,
}: PageProps<"/[locale]/dashboard/rating">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const period = pick(query.period, PERIODS) ?? "week";
  const scope = pick(query.scope, ["course", "group"] as const);
  const id = Number(Array.isArray(query.id) ? query.id[0] : query.id) || null;
  const [t, board] = await Promise.all([
    getTranslations("Rewards"),
    getRating(locale, period, scope, id),
  ]);
  const scopes = board?.scopes ?? [];
  const current = board ? `${board.scope}:${board.scope_id}` : "";
  const href = (next: { period?: RatingPeriod; scope?: string; id?: number | null }) => {
    const values = new URLSearchParams({ period: next.period ?? period });
    const kind = next.scope ?? board?.scope;
    const pk = next.id ?? board?.scope_id;
    if (kind && pk) {
      values.set("scope", kind);
      values.set("id", String(pk));
    }
    return `/dashboard/rating?${values}`;
  };

  return (
    <>
      <header>
        <h1 className="app-title">{t("ratingTitle")}</h1>
        <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{t("ratingIntro")}</p>
      </header>

      <nav aria-label={t("periodLabel")} className="rv-tabs mt-8">
        {PERIODS.map((value) => (
          <Link
            key={value}
            href={href({ period: value })}
            className="rv-tab"
            aria-current={value === period ? "page" : undefined}
          >
            {t(`period.${value}`)}
          </Link>
        ))}
      </nav>

      {scopes.length > 1 && (
        <nav aria-label={t("scopeLabel")} className="rv-groups mt-4">
          {scopes.map((item) => (
            <Link
              key={`${item.kind}:${item.id}`}
              href={href({ scope: item.kind, id: item.id })}
              className="teach-chip"
              aria-current={`${item.kind}:${item.id}` === current ? "page" : undefined}
            >
              {t(`scope.${item.kind}`, { title: item.title })}
            </Link>
          ))}
        </nav>
      )}

      {!board || scopes.length === 0 ? (
        <div className="app-empty mt-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-caret">
            <Medal aria-hidden className="size-6" />
          </span>
          <p className="max-w-lg text-pretty text-muted-foreground">{t("ratingEmpty")}</p>
        </div>
      ) : (
        <section aria-labelledby="rating-board" className="app-card mt-6">
          <h2 id="rating-board" className="sr-only">
            {t("ratingBoard")}
          </h2>
          {board.top.length === 0 ? (
            <p className="text-muted-foreground">{t("ratingNobody")}</p>
          ) : (
            <ol className="rt-board">
              {board.top.map((row) => (
                <li key={row.place} data-me={row.me ? "" : undefined}>
                  <span className="rt-board__place">
                    {row.place <= 3 ? (
                      <span role="img" aria-label={t("place", { place: row.place })}>
                        {MEDALS[row.place - 1]}
                      </span>
                    ) : (
                      row.place
                    )}
                  </span>
                  <span className="rt-board__name">
                    {row.name}
                    {row.me && <span className="rt-board__you">{t("you")}</span>}
                  </span>
                  <span className="rt-board__xp">
                    {t("xpValue", { value: formatNumber(row.xp, locale) })}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {board.me && (
            <p className="rt-me">
              {board.me.hidden ? (
                <>
                  <EyeOff aria-hidden className="size-4 shrink-0" />
                  <span>
                    {t("meHidden", { xp: board.me.xp })}{" "}
                    <Link href="/dashboard/settings" className="note__link">
                      {t("toSettings")}
                    </Link>
                  </span>
                </>
              ) : board.me.place ? (
                t("mePlace", { place: board.me.place, total: board.total, xp: board.me.xp })
              ) : (
                t("meNone")
              )}
            </p>
          )}
        </section>
      )}
    </>
  );
}
