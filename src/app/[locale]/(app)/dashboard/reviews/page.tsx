import { ArrowRight, ClipboardCheck, Paperclip } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getReviews } from "@/lib/api/homework";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/reviews">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Reviews" });
  return { title: t("title"), robots: { index: false } };
}

// Shuncha soatdan beri kutayotgan javob ajratib ko'rsatiladi (admin statistikasi bilan bir xil).
const OVERDUE_HOURS = 48;

/** O'qituvchi: tekshirish navbati (eng eskisi tepada) va tekshirilganlar. */
export default async function ReviewsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/dashboard/reviews">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const status = query.status === "reviewed" ? "reviewed" : "pending";
  const groupValue = Number(typeof query.group === "string" ? query.group : "");
  const group = Number.isInteger(groupValue) && groupValue > 0 ? groupValue : null;

  const [t, format, data] = await Promise.all([
    getTranslations("Reviews"),
    getFormatter(),
    getReviews(locale, status, group),
  ]);
  if (data === null) notFound();
  const now = new Date();
  const overdueBefore = now.getTime() - OVERDUE_HOURS * 60 * 60 * 1000;
  const tabQuery = (value: "pending" | "reviewed") => ({
    ...(value === "reviewed" ? { status: value } : {}),
    ...(group ? { group: String(group) } : {}),
  });

  return (
    <>
      <header>
        <h1 className="app-title">{t("title")}</h1>
        <p className="mt-3 max-w-xl text-pretty text-muted-foreground">{t("intro")}</p>
      </header>

      <nav aria-label={t("tabs")} className="rv-tabs mt-8">
        <Link
          href={{ pathname: "/dashboard/reviews", query: tabQuery("pending") }}
          aria-current={status === "pending" ? "page" : undefined}
          className="rv-tab"
        >
          {t("pending")} <span className="rv-tab__count">{data.pending}</span>
        </Link>
        <Link
          href={{ pathname: "/dashboard/reviews", query: tabQuery("reviewed") }}
          aria-current={status === "reviewed" ? "page" : undefined}
          className="rv-tab"
        >
          {t("reviewed")}
        </Link>
      </nav>

      {data.groups.length > 1 && (
        <nav aria-label={t("groupFilter")} className="rv-groups mt-4">
          <Link
            href={{
              pathname: "/dashboard/reviews",
              query: status === "reviewed" ? { status } : {},
            }}
            aria-current={group === null ? "page" : undefined}
            className="teach-chip"
          >
            {t("allGroups")}
          </Link>
          {data.groups.map((item) => (
            <Link
              key={item.id}
              href={{
                pathname: "/dashboard/reviews",
                query: { ...(status === "reviewed" ? { status } : {}), group: String(item.id) },
              }}
              aria-current={group === item.id ? "page" : undefined}
              className="teach-chip"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      )}

      {data.results.length === 0 ? (
        <div className="app-empty mt-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-caret">
            <ClipboardCheck aria-hidden className="size-6" />
          </span>
          <p className="max-w-lg text-pretty text-muted-foreground">
            {status === "pending" ? t("emptyPending") : t("emptyReviewed")}
          </p>
        </div>
      ) : (
        <ul className="rv-list mt-6">
          {data.results.map((item) => {
            const sent = new Date(item.created_at);
            const overdue = status === "pending" && sent.getTime() < overdueBefore;
            return (
              <li key={item.id}>
                <Link href={`/dashboard/reviews/${item.id}`} className="rv-card">
                  <span className="rv-card__main">
                    <span className="rv-card__who">
                      {item.student_name}
                      {item.group_name && <span className="teach-chip">{item.group_name}</span>}
                    </span>
                    <span className="rv-card__what">
                      {item.course_title} · {item.lesson_title}
                    </span>
                    {item.preview && <span className="rv-card__preview">{item.preview}</span>}
                  </span>
                  <span className="rv-card__side">
                    {status === "pending" ? (
                      <span className={overdue ? "rv-age rv-age--late" : "rv-age"}>
                        {format.relativeTime(sent, now)}
                      </span>
                    ) : (
                      <span className="hw-status" data-status={item.status}>
                        {item.status === "ACCEPTED"
                          ? t("score", { score: item.score ?? 0 })
                          : t("returned")}
                      </span>
                    )}
                    <span className="rv-card__meta">
                      {t("attempt", { number: item.attempt })}
                      {item.files_count > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Paperclip aria-hidden className="size-3.5" />
                          {item.files_count}
                        </span>
                      )}
                      {item.late && <span className="hw-flag">{t("late")}</span>}
                    </span>
                  </span>
                  <ArrowRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
