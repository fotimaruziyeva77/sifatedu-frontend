import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { DailyStrip } from "@/features/daily-test/daily-strip";
import { ExamReview } from "@/features/exams/exam-review";
import { notFoundMetadata } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import { getDailyReview } from "@/lib/api/daily-test";

function attemptId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/daily-test/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const pk = attemptId(id);
  const review = pk ? await getDailyReview(locale, pk) : null;
  if (!review) return notFoundMetadata(locale);
  const t = await getTranslations({ locale, namespace: "DailyTest" });
  return { title: t("title"), robots: { index: false } };
}

/** Kunlik test javoblari: test yopilgach (23:00 dan keyin) — xatolar birinchi, izohlar bilan. */
export default async function DailyReviewPage({
  params,
}: PageProps<"/[locale]/dashboard/daily-test/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const pk = attemptId(id);
  if (!pk) notFound();
  const [t, format, review] = await Promise.all([
    getTranslations("DailyTest"),
    getFormatter(),
    getDailyReview(locale, pk),
  ]);
  if (!review) notFound();
  const day = format.dateTime(new Date(`${review.day}T12:00:00Z`), {
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <Link
        href="/dashboard/daily-test"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {t("back")}
      </Link>

      <header className="mt-4">
        <p className="text-sm text-muted-foreground">{review.group}</p>
        <h1 className="app-title mt-1">{t("reviewTitle", { day })}</h1>
        <p className="mt-3 font-semibold">
          {t("rightWrong", { right: review.correct, wrong: review.total - review.correct })}
        </p>
        <DailyStrip
          correct={review.correct}
          total={review.total}
          label={t("stripLabel", { right: review.correct, total: review.total })}
        />
      </header>

      <div className="mt-8">
        <ExamReview test={review} />
      </div>
    </>
  );
}
