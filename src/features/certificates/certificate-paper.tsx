import { getFormatter, getTranslations } from "next-intl/server";

import { Logo } from "@/components/brand/logo";
import type { Certificate } from "@/lib/api/exams";

import { journey } from "./path";
import { qrShape } from "./qr";

const WIDTH = 1000;
const HEIGHT = 150;

/**
 * Sertifikat varag'i (A4, albom): ism, kurs, ball, sana, raqam va tekshirish QR kodi. Pastdagi
 * bog'langan nuqtalar yo'li raqamdan chiziladi va brend kursorida tugaydi. Ekranda ham, chop
 * etishda ham (PDF) bir xil ko'rinadi — varaq har doim oq.
 */
export async function CertificatePaper({
  certificate,
  url,
}: {
  certificate: Certificate;
  url: string;
}) {
  const [t, format] = await Promise.all([getTranslations("Certificates"), getFormatter()]);
  const issued = format.dateTime(new Date(certificate.issued_at), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const qr = qrShape(url);
  const points = journey(certificate.number).map((point) => ({
    x: point.x * WIDTH,
    y: point.y * HEIGHT,
  }));
  const line = points
    .map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join("");
  const end = points[points.length - 1];
  const shortUrl = url.replace(/^https?:\/\//, "");

  return (
    <article
      className="cert-paper"
      aria-label={t("paperLabel", { name: certificate.full_name })}
      data-revoked={certificate.valid ? undefined : ""}
    >
      <div className="cert-paper__sheet">
        <header className="cert-paper__top">
          <Logo className="cert-paper__logo" />
          <p className="cert-paper__number">
            <span>{t("numberLabel")}</span>
            {certificate.number}
          </p>
        </header>

        <div className="cert-paper__body">
          <p className="cert-paper__eyebrow">{t("eyebrow")}</p>
          <p className="cert-paper__lead">{t("lead")}</p>
          <p className="cert-paper__name">{certificate.full_name}</p>
          <p className="cert-paper__statement">
            {t.rich("statement", {
              course: certificate.course_title,
              b: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </div>

        <svg className="cert-paper__path" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden>
          <path d={line} />
          {points.slice(0, -1).map((point, index) => (
            <circle key={index} cx={point.x} cy={point.y} r={index === 0 ? 7 : 5.5} />
          ))}
          <circle className="cert-paper__halo" cx={end.x} cy={end.y} r={17} />
          <rect x={end.x - 5} y={end.y - 13} width={10} height={26} rx={2.5} />
        </svg>

        <footer className="cert-paper__foot">
          <dl className="cert-paper__facts">
            <div>
              <dt>{t("score")}</dt>
              <dd>{t("scoreValue", { score: certificate.score })}</dd>
            </div>
            <div>
              <dt>{t("issued")}</dt>
              <dd>{issued}</dd>
            </div>
            <div>
              <dt>{t("issuer")}</dt>
              <dd>{t("issuerName")}</dd>
            </div>
          </dl>
          <div className="cert-paper__verify">
            <svg
              viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`}
              role="img"
              aria-label={t("qrLabel")}
              className="cert-paper__qr"
            >
              <rect x={-2} y={-2} width={qr.size + 4} height={qr.size + 4} fill="#fff" />
              <path d={qr.dots} className="cert-paper__qr-dots" />
              {qr.eyes.map((eye) => (
                <g key={`${eye.x}-${eye.y}`}>
                  <rect
                    x={eye.x + 0.5}
                    y={eye.y + 0.5}
                    width={6}
                    height={6}
                    rx={1.6}
                    className="cert-paper__qr-ring"
                  />
                  <rect
                    x={eye.x + 2}
                    y={eye.y + 2}
                    width={3}
                    height={3}
                    rx={0.9}
                    className="cert-paper__qr-pupil"
                  />
                </g>
              ))}
            </svg>
            <p>
              {t("verifyAt")}
              <span>{shortUrl}</span>
            </p>
          </div>
        </footer>

        {!certificate.valid && (
          <p className="cert-paper__stamp" aria-hidden>
            {t("revokedStamp")}
          </p>
        )}
      </div>
    </article>
  );
}
