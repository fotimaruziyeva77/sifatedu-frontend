"use client";

import { Check, Copy, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const EXTENSIONS: Record<string, string> = {
  html: "html",
  css: "css",
  javascript: "js",
  js: "js",
  typescript: "ts",
  ts: "ts",
  python: "py",
  py: "py",
  json: "json",
  sql: "sql",
  bash: "sh",
};

/** Darsda yozilgan kod: nusxalash va fayl sifatida yuklab olish mumkin. */
export function CodeBlock({
  title,
  code,
  language,
}: {
  title: string;
  code: string;
  language: string;
}) {
  const t = useTranslations("Learn");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function download() {
    const extension = EXTENSIONS[language.toLowerCase()] ?? "txt";
    const name = /\.[a-z0-9]+$/i.test(title) ? title : `${title}.${extension}`;
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <figure className="code-block">
      <figcaption className="code-block__bar">
        <span className="code-block__title">{title}</span>
        {language && <span className="code-block__lang">{language}</span>}
        <span className="ml-auto flex gap-1">
          <button type="button" onClick={() => void copy()} className="code-block__action">
            {copied ? (
              <Check aria-hidden className="size-4" />
            ) : (
              <Copy aria-hidden className="size-4" />
            )}
            {copied ? t("copied") : t("copy")}
          </button>
          <button type="button" onClick={download} className="code-block__action">
            <Download aria-hidden className="size-4" />
            {t("download")}
          </button>
        </span>
      </figcaption>
      <pre className="code-block__pre" tabIndex={0}>
        <code>{code}</code>
      </pre>
    </figure>
  );
}
