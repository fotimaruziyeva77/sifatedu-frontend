"use client";

import { BriefcaseBusiness, Check, Copy, Download, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Sertifikat bilan: PDF (brauzerning chop etish oynasi → "PDF sifatida saqlash"), havolani
 * nusxalash, Telegram'da ulashish va LinkedIn profiliga qo'shish.
 */
export function CertificateActions({
  url,
  number,
  course,
  issued,
}: {
  url: string;
  number: string;
  course: string;
  /** ISO sana (backend vaqt zonasida): LinkedIn'ga yil va oy uchun. */
  issued: string;
}) {
  const t = useTranslations("Certificates");
  const [copied, setCopied] = useState(false);
  // Yil va oy satrdan olinadi: `new Date` brauzer va serverda turli vaqt zonasida farq qilib,
  // oy chegarasida hydration xatosiga olib kelardi.
  const [year, month] = issued.slice(0, 7).split("-");
  const telegram = `https://t.me/share/url?${new URLSearchParams({
    url,
    text: t("shareText", { course }),
  })}`;
  const linkedin = `https://www.linkedin.com/profile/add?${new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: course,
    organizationName: "Sifat Edu",
    issueYear: year,
    issueMonth: String(Number(month)),
    certUrl: url,
    certId: number,
  })}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt(t("copyManual"), url);
    }
  }

  return (
    <div className="cert-actions">
      <Button type="button" onClick={() => window.print()} className="h-11 gap-2 rounded-full px-5">
        <Download aria-hidden />
        {t("pdf")}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => void copy()}
        className="h-11 gap-2 rounded-full px-5"
      >
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? t("copied") : t("copy")}
      </Button>
      <Button asChild variant="outline" className="h-11 gap-2 rounded-full px-5">
        <a href={telegram} target="_blank" rel="noopener noreferrer">
          <Send aria-hidden />
          {t("telegram")}
        </a>
      </Button>
      <Button asChild variant="outline" className="h-11 gap-2 rounded-full px-5">
        <a href={linkedin} target="_blank" rel="noopener noreferrer">
          <BriefcaseBusiness aria-hidden />
          {t("linkedin")}
        </a>
      </Button>
      <p className="cert-actions__hint">{t("pdfHint")}</p>
    </div>
  );
}
