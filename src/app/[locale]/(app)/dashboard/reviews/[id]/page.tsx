import { ArrowLeft, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { ReviewForm } from "@/features/homework/review-form";
import { SubmissionView } from "@/features/homework/submission-view";
import { notFoundMetadata } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import { getReview } from "@/lib/api/homework";

function reviewId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/reviews/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const pk = reviewId(id);
  const review = pk ? await getReview(locale, pk) : null;
  if (!review) return notFoundMetadata(locale);
  return { title: `${review.student_name} · ${review.lesson_title}`, robots: { index: false } };
}

/** Javobni tekshirish: topshiriq, javob (kod, rasmlar, fayllar), oldingi urinishlar va qaror. */
export default async function ReviewPage({
  params,
}: PageProps<"/[locale]/dashboard/reviews/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const pk = reviewId(id);
  if (!pk) notFound();
  const [t, format, review] = await Promise.all([
    getTranslations("Reviews"),
    getFormatter(),
    getReview(locale, pk),
  ]);
  if (!review) notFound();
  const when = (value: string) =>
    format.dateTime(new Date(value), {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  const submission = review.submission;

  return (
    <div className="rv-page">
      <Link
        href="/dashboard/reviews"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {t("title")}
      </Link>

      <header className="mt-4">
        <p className="text-sm text-muted-foreground">
          {review.course_title} · {review.lesson_title}
        </p>
        <h1 className="app-title mt-1">{review.student_name}</h1>
        <ul className="teach-chips mt-4">
          {review.group_name && <li className="teach-chip">{review.group_name}</li>}
          <li className="teach-chip">{t("attempt", { number: review.attempt })}</li>
          <li className="teach-chip">{when(submission.created_at)}</li>
          {review.late && <li className="teach-chip hw-flag">{t("late")}</li>}
          <li className="teach-chip">
            <a
              href={`tel:${review.student_phone}`}
              className="inline-flex items-center gap-1.5"
              aria-label={t("call", { name: review.student_name })}
            >
              <Phone aria-hidden className="size-3.5" />
              {review.student_phone}
            </a>
          </li>
        </ul>
      </header>

      <details className="hw-history mt-6">
        <summary>
          {t("task")}: {review.assignment_title}
        </summary>
        <p className="hw-panel__task mt-3">{review.instructions}</p>
      </details>

      <section aria-labelledby="answer" className="app-card mt-6">
        <h2 id="answer" className="app-section-title mb-4">
          {t("answer")}
        </h2>
        <SubmissionView submission={submission} />
      </section>

      {submission.status === "SUBMITTED" ? (
        <section className="app-card mt-6">
          <ReviewForm submissionId={review.id} nextId={review.next_id} />
        </section>
      ) : (
        <section className="hw-review mt-6" data-status={submission.status}>
          <p className="hw-review__title">
            {submission.status === "ACCEPTED"
              ? t("score", { score: submission.score ?? 0 })
              : t("returned")}
          </p>
          {submission.feedback && <p className="hw-review__text">{submission.feedback}</p>}
          <p className="hw-review__meta">
            {submission.reviewer_name}
            {submission.reviewed_at ? ` · ${when(submission.reviewed_at)}` : ""}
          </p>
          {review.next_id && (
            <Link href={`/dashboard/reviews/${review.next_id}`} className="note__link mt-2">
              {t("next")}
            </Link>
          )}
        </section>
      )}

      {review.history.length > 0 && (
        <section aria-labelledby="history" className="mt-8">
          <h2 id="history" className="app-section-title">
            {t("history")}
          </h2>
          <ol className="mt-4 grid gap-4">
            {review.history.map((item) => (
              <li key={item.id} className="hw-attempt app-card">
                <p className="hw-attempt__meta">
                  {t("attempt", { number: item.attempt })} · {when(item.created_at)}
                </p>
                <SubmissionView submission={item} />
                {item.feedback && (
                  <p className="hw-attempt__feedback">
                    <strong>{item.reviewer_name}:</strong> {item.feedback}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
