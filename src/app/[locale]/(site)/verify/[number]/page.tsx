import { BadgeCheck, SearchX, ShieldX } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { CertificateActions } from "@/features/certificates/certificate-actions";
import { CertificatePaper } from "@/features/certificates/certificate-paper";
import { getCertificate } from "@/lib/api/exams";

import "@/features/certificates/certificate.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost";
// SE-YYMM-XXXXXX: boshqa satrlar backend'ga yuborilmaydi.
const NUMBER = /^SE-\d{4}-[A-Z0-9]{6}$/;

function normalize(value: string): string | null {
  const number = decodeURIComponent(value).trim().toUpperCase();
  return NUMBER.test(number) ? number : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/verify/[number]">): Promise<Metadata> {
  const { locale, number } = await params;
  const t = await getTranslations({ locale, namespace: "Certificates" });
  const code = normalize(number);
  const certificate = code ? await getCertificate(locale, code) : null;
  // Shaxsiy ma'lumot (ism): qidiruv tizimlariga berilmaydi.
  return {
    title: certificate
      ? t("metaTitle", { name: certificate.full_name, course: certificate.course_title })
      : t("notFoundTitle"),
    robots: { index: false, follow: false },
  };
}

/**
 * Ommaviy tekshirish sahifasi (QR shu yerga olib keladi): sertifikat haqiqiymi, kimga, qaysi
 * kurs uchun va qachon berilgan. Egasi shu yerdan PDF saqlaydi va ulashadi.
 */
export default async function VerifyPage({ params }: PageProps<"/[locale]/verify/[number]">) {
  const { locale, number } = await params;
  setRequestLocale(locale);
  const code = normalize(number);
  const [t, format, certificate] = await Promise.all([
    getTranslations("Certificates"),
    getFormatter(),
    code ? getCertificate(locale, code) : Promise.resolve(null),
  ]);

  if (!certificate) {
    return (
      <div className="cert-page">
        <div className="cert-missing">
          <SearchX aria-hidden className="size-8" />
          <h1 className="cert-page__title">{t("notFoundTitle")}</h1>
          <p className="text-muted-foreground">
            {t("notFoundText", { number: code ?? decodeURIComponent(number) })}
          </p>
        </div>
      </div>
    );
  }

  const url = `${APP_URL}/verify/${certificate.number}`;
  const date = (value: string) =>
    format.dateTime(new Date(value), { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="cert-page">
      <div className="cert-status" data-valid={certificate.valid ? "" : undefined} role="status">
        {certificate.valid ? (
          <BadgeCheck aria-hidden className="size-6 shrink-0" />
        ) : (
          <ShieldX aria-hidden className="size-6 shrink-0" />
        )}
        <div>
          <h1 className="cert-status__title">
            {certificate.valid ? t("validTitle") : t("revokedTitle")}
          </h1>
          <p className="cert-status__text">
            {certificate.valid
              ? t("validText", { date: date(certificate.issued_at) })
              : t("revokedText", {
                  date: certificate.revoked_at ? date(certificate.revoked_at) : "",
                  reason: certificate.revoke_reason || "—",
                })}
          </p>
        </div>
      </div>

      <dl className="cert-facts">
        <div>
          <dt>{t("factName")}</dt>
          <dd>{certificate.full_name}</dd>
        </div>
        <div>
          <dt>{t("factCourse")}</dt>
          <dd>{certificate.course_title}</dd>
        </div>
        <div>
          <dt>{t("score")}</dt>
          <dd>{t("scoreValue", { score: certificate.score })}</dd>
        </div>
        <div>
          <dt>{t("issued")}</dt>
          <dd>{date(certificate.issued_at)}</dd>
        </div>
        <div>
          <dt>{t("factNumber")}</dt>
          <dd className="font-mono">{certificate.number}</dd>
        </div>
      </dl>

      <div className="cert-stage">
        <CertificatePaper certificate={certificate} url={url} />
      </div>

      {certificate.valid && (
        <CertificateActions
          url={url}
          number={certificate.number}
          course={certificate.course_title}
          issued={certificate.issued_at}
        />
      )}
    </div>
  );
}
