"use client";

import { Download, ExternalLink, FileText } from "lucide-react";
import { useTranslations } from "next-intl";

import { CodeBlock } from "@/features/lesson/code-block";
import type { components } from "@/lib/api/schema";

/** Uy vazifasi javobi yoki imtihon topshirig'i javobi: mazmuni bir xil. */
type Answer = Pick<
  components["schemas"]["Submission"],
  "text" | "code" | "language" | "link" | "files"
>;

export function fileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Javob mazmuni: izoh, kod, havola, rasmlar va fayllar. O'quvchining tarixida ham, o'qituvchining
 * tekshirish sahifasida ham bir xil ko'rinadi.
 */
export function SubmissionView({ submission }: { submission: Answer }) {
  const t = useTranslations("Homework");
  const images = submission.files.filter((file) => file.is_image);
  const others = submission.files.filter((file) => !file.is_image);

  return (
    <div className="hw-answer">
      {submission.text && <p className="hw-answer__text">{submission.text}</p>}
      {submission.code && (
        <CodeBlock title={t("codeTitle")} code={submission.code} language={submission.language} />
      )}
      {submission.link && (
        <a
          href={submission.link}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="hw-answer__link"
        >
          <ExternalLink aria-hidden className="size-4 shrink-0" />
          <span className="truncate">{submission.link}</span>
        </a>
      )}
      {images.length > 0 && (
        <ul className="hw-images" aria-label={t("images")}>
          {images.map((file) => (
            <li key={file.id}>
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                {/* Imzolangan S3 havolasi: next/image optimizatsiyasi kerak emas. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={file.url} alt={file.name} loading="lazy" />
              </a>
            </li>
          ))}
        </ul>
      )}
      {others.length > 0 && (
        <ul className="hw-files" aria-label={t("files")}>
          {others.map((file) => (
            <li key={file.id}>
              <a href={file.url} className="hw-file" download={file.name}>
                <FileText aria-hidden className="size-4 shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="hw-file__size">{fileSize(file.size)}</span>
                <Download aria-hidden className="ml-auto size-4 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
