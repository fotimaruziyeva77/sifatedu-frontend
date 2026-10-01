import { ExternalLink, FileDown, Paperclip } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { LessonPlayer } from "@/lib/api/learning";

import { CodeBlock } from "./code-block";

type Material = LessonPlayer["materials"][number];

function fileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Dars materiallari: fayllar, foydali havolalar va darsda yozilgan kodlar. */
export async function LessonMaterials({ materials }: { materials: Material[] }) {
  if (materials.length === 0) return null;
  const t = await getTranslations("Learn");
  const files = materials.filter((item) => item.kind !== "CODE");
  const codes = materials.filter((item) => item.kind === "CODE");

  return (
    <section aria-labelledby="materials" className="mt-10">
      <h2 id="materials" className="app-section-title flex items-center gap-2">
        <Paperclip aria-hidden className="size-5 text-caret" />
        {t("materials")}
      </h2>

      {files.length > 0 && (
        <ul className="material-list mt-4">
          {files.map((item) => {
            const link = item.kind === "LINK";
            return (
              <li key={item.id}>
                <a
                  href={item.url}
                  className="material-row"
                  target={link ? "_blank" : undefined}
                  rel={link ? "noopener noreferrer" : undefined}
                  download={link ? undefined : true}
                >
                  <span aria-hidden className="material-row__icon">
                    {link ? <ExternalLink className="size-4" /> : <FileDown className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {link ? t("openLink") : fileSize(item.size) || t("download")}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {codes.length > 0 && (
        <div className="mt-6 grid gap-4">
          <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {t("lessonCode")}
          </h3>
          {codes.map((item) => (
            <CodeBlock key={item.id} title={item.title} code={item.code} language={item.language} />
          ))}
        </div>
      )}
    </section>
  );
}
