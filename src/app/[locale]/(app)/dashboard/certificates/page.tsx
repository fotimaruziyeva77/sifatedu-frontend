import { ArrowRight, Award, Check, Circle } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getMyCertificates } from "@/lib/api/exams";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/certificates">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Certificates" });
  return { title: t("title"), robots: { index: false } };
}

/**
 * Sertifikatlarim: berilganlari (ko'rish, PDF, ulashish — tekshirish sahifasida) va hali
 * olinmagan kurslar bo'yicha shartlar: nima bajarildi, nima qoldi.
 */
export default async function CertificatesPage({
  params,
}: PageProps<"/[locale]/dashboard/certificates">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, format, data] = await Promise.all([
    getTranslations("Certificates"),
    getFormatter(),
    getMyCertificates(locale),
  ]);
  const certificates = data?.certificates ?? [];
  const progress = data?.progress ?? [];
  const date = (value: string) =>
    format.dateTime(new Date(value), { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <header>
        <h1 className="app-title">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{t("intro")}</p>
      </header>

      {certificates.length > 0 && (
        <ul className="cert-list mt-8">
          {certificates.map((certificate) => (
            <li key={certificate.number}>
              <article
                className="cert-card"
                aria-labelledby={`cert-${certificate.number}`}
                data-revoked={certificate.valid ? undefined : ""}
              >
                <span aria-hidden className="cert-card__seal">
                  <Award className="size-6" />
                </span>
                <div className="min-w-0">
                  <h2 id={`cert-${certificate.number}`} className="cert-card__title">
                    <Link href={`/verify/${certificate.number}`} className="teach-card__link">
                      {certificate.course_title}
                    </Link>
                  </h2>
                  <p className="cert-card__meta">
                    <span className="font-mono">{certificate.number}</span> ·{" "}
                    {date(certificate.issued_at)} · {t("scoreShort", { score: certificate.score })}
                  </p>
                  {!certificate.valid && (
                    <p className="cert-card__revoked">
                      {t("revokedShort", { reason: certificate.revoke_reason || "—" })}
                    </p>
                  )}
                </div>
                <ArrowRight aria-hidden className="exam-card__arrow size-5" />
              </article>
            </li>
          ))}
        </ul>
      )}

      {progress.length > 0 && (
        <section aria-labelledby="cert-progress" className="mt-10">
          <h2 id="cert-progress" className="app-section-title">
            {t("progressTitle")}
          </h2>
          <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">{t("progressIntro")}</p>
          <ul className="cert-progress mt-5">
            {progress.map((course) => {
              const done = course.requirements.filter((item) => item.ok).length;
              return (
                <li key={course.course_slug} className="app-card">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-heading text-lg font-semibold">{course.course_title}</h3>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {t("progressCount", { done, total: course.requirements.length })}
                    </span>
                  </div>
                  <ul className="cert-checks">
                    {course.requirements.map((item) => (
                      <li key={item.code} data-ok={item.ok ? "" : undefined}>
                        {item.ok ? (
                          <Check aria-hidden className="size-4 shrink-0" />
                        ) : (
                          <Circle aria-hidden className="size-4 shrink-0" />
                        )}
                        <span>
                          {t(`requirement.${item.code}`, { done: item.done, total: item.total })}
                        </span>
                        <span className="sr-only">{item.ok ? t("done") : t("notDone")}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {certificates.length === 0 && progress.length === 0 && (
        <div className="app-empty mt-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-caret">
            <Award aria-hidden className="size-6" />
          </span>
          <p className="max-w-lg text-pretty text-muted-foreground">{t("empty")}</p>
        </div>
      )}
    </>
  );
}
