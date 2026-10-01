"use client";

import {
  CheckCircle2,
  ClipboardList,
  Code2,
  Hourglass,
  Paperclip,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

import {
  ALLOWED_EXTENSIONS,
  checkFiles,
  CODE_LANGUAGES,
  IMAGE_EXTENSIONS,
  extensionOf,
  MAX_FILE_MB,
  MAX_FILES,
  MAX_TOTAL_MB,
} from "./limits";
import { fileSize, SubmissionView } from "./submission-view";
import { uploadAnswer } from "./upload";

type Homework = components["schemas"]["Homework"];
type Submission = components["schemas"]["Submission"];

/** Serverda formatlangan sanalar (brauzerlarda o'zbekcha oy nomlari yo'q). */
export type HomeworkDates = {
  deadline: string | null;
  attempts: Record<number, { created: string; reviewed: string | null }>;
};

/**
 * Dars sahifasidagi uy vazifasi: topshiriq, holat, o'qituvchi izohi, javob formasi va tarix.
 * Yuborilgach sahifa serverdan yangilanadi (`router.refresh`) — holat va sanalar bir joydan.
 */
export function HomeworkPanel({ homework, dates }: { homework: Homework; dates: HomeworkDates }) {
  const t = useTranslations("Homework");
  const [latest, ...older] = homework.attempts;
  const canAnswer = homework.status === "NOT_SUBMITTED" || homework.status === "CHANGES_REQUESTED";
  // Tekshirilayotgan javob yuqorida to'liq ko'rinadi; tekshirilganlarining mazmuni — tarixda.
  const history = homework.status === "SUBMITTED" ? older : homework.attempts;

  return (
    <section id="homework" aria-labelledby="homework-title" className="hw-panel">
      <header className="hw-panel__head">
        <span aria-hidden className="hw-panel__icon">
          <ClipboardList className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{t("title")}</p>
          <h2 id="homework-title" className="app-section-title">
            {homework.title}
          </h2>
        </div>
        <StatusChip status={homework.status} score={latest?.score ?? null} />
      </header>

      <p className="hw-panel__task">{homework.instructions}</p>
      {dates.deadline && (
        <p className="hw-panel__deadline">{t("deadline", { date: dates.deadline })}</p>
      )}

      {latest && latest.status !== "SUBMITTED" && (
        <Review submission={latest} reviewed={dates.attempts[latest.id]?.reviewed ?? null} />
      )}

      {homework.status === "SUBMITTED" && latest && (
        <Pending submission={latest} created={dates.attempts[latest.id]?.created ?? ""} />
      )}

      {canAnswer && (
        <AnswerForm
          action={`/api/v1/homework/${homework.id}/submissions/`}
          again={Boolean(latest)}
        />
      )}

      {history.length > 0 && (
        <details className="hw-history">
          <summary>{t("history", { count: history.length })}</summary>
          <ol>
            {history.map((item) => (
              <li key={item.id} className="hw-attempt">
                <p className="hw-attempt__meta">
                  {t("attempt", { number: item.attempt })} · {dates.attempts[item.id]?.created}
                  {item.late && <span className="hw-flag">{t("late")}</span>}
                </p>
                <SubmissionView submission={item} />
                {item.feedback && (
                  <p className="hw-attempt__feedback">
                    <strong>{t("teacherNote")}:</strong> {item.feedback}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}

function StatusChip({ status, score }: { status: Homework["status"]; score: number | null }) {
  const t = useTranslations("Homework");
  return (
    <span className="hw-status" data-status={status}>
      {status === "ACCEPTED" && score !== null
        ? t("acceptedScore", { score })
        : t(`status.${status}`)}
    </span>
  );
}

function Review({ submission, reviewed }: { submission: Submission; reviewed: string | null }) {
  const t = useTranslations("Homework");
  const accepted = submission.status === "ACCEPTED";
  return (
    <div className="hw-review" data-status={submission.status}>
      <p className="hw-review__title">
        {accepted ? (
          <CheckCircle2 aria-hidden className="size-5" />
        ) : (
          <RotateCcw aria-hidden className="size-5" />
        )}
        {accepted ? t("acceptedTitle", { score: submission.score ?? 0 }) : t("returnedTitle")}
      </p>
      {submission.feedback && <p className="hw-review__text">{submission.feedback}</p>}
      <p className="hw-review__meta">
        {submission.reviewer_name}
        {reviewed ? ` · ${reviewed}` : ""}
      </p>
    </div>
  );
}

function Pending({ submission, created }: { submission: Submission; created: string }) {
  const t = useTranslations("Homework");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withdraw() {
    if (!window.confirm(t("withdrawConfirm"))) return;
    setBusy(true);
    setError(null);
    try {
      const { response } = await api.DELETE("/api/v1/homework/submissions/{id}/", {
        params: { path: { id: submission.id } },
      });
      if (response.ok) {
        router.refresh();
        return;
      }
      setError(t("errors.server"));
    } catch {
      setError(t("errors.network"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hw-pending">
      <p className="hw-pending__title">
        <Hourglass aria-hidden className="size-5" />
        {t("pendingTitle")}
      </p>
      <p className="text-sm text-muted-foreground">
        {t("attempt", { number: submission.attempt })} · {created}
        {submission.late && <span className="hw-flag">{t("late")}</span>}
      </p>
      <SubmissionView submission={submission} />
      <Button
        type="button"
        variant="outline"
        onClick={() => void withdraw()}
        disabled={busy}
        className="h-10 w-fit rounded-full px-4"
      >
        {t("withdraw")}
      </Button>
      {error && (
        <p role="alert" className="hw-error">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Javob formasi: izoh, kod, havola va fayllar (yuklash foizi bilan). Uy vazifasida ham, oylik
 * imtihonning amaliy topshiriqlarida ham ishlatiladi (`action` — qaysi manzilga yuboriladi).
 */
export function AnswerForm({
  action,
  again,
  title,
}: {
  action: string;
  again: boolean;
  title?: string;
}) {
  const t = useTranslations("Homework");
  const router = useRouter();
  const ids = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<(typeof CODE_LANGUAGES)[number]>("html");
  const [link, setLink] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Tanlangan rasmlar ko'rinishi: vaqtinchalik havolalar keyin tozalanadi.
  const previews = useMemo(
    () =>
      files.map((file) =>
        IMAGE_EXTENSIONS.includes(extensionOf(file.name)) ? URL.createObjectURL(file) : null,
      ),
    [files],
  );
  useEffect(() => () => previews.forEach((url) => url && URL.revokeObjectURL(url)), [previews]);

  function fileProblem(next: File[]): string | null {
    const { problem, name } = checkFiles(next);
    if (problem === "type") return t("errors.type", { name: name ?? "" });
    if (problem === "size") return t("errors.size", { name: name ?? "", mb: MAX_FILE_MB });
    if (problem === "count") return t("errors.count", { count: MAX_FILES });
    if (problem === "total") return t("errors.total", { mb: MAX_TOTAL_MB });
    return null;
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list)];
    const problem = fileProblem(next);
    setError(problem);
    if (!problem) setFiles(next);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const hasCode = showCode && code.trim() !== "";
    if (!text.trim() && !hasCode && !link.trim() && files.length === 0) {
      setError(t("errors.empty"));
      return;
    }
    const form = new FormData();
    form.append("text", text);
    if (hasCode) {
      form.append("code", code);
      form.append("language", language);
    }
    if (link.trim()) form.append("link", link.trim());
    files.forEach((file) => form.append("files", file, file.name));

    setProgress(0);
    const result = await uploadAnswer(action, form, setProgress);
    setProgress(null);
    if (result.ok) {
      setSent(true);
      setText("");
      setCode("");
      setLink("");
      setFiles([]);
      router.refresh();
      return;
    }
    const fields = result.fields ?? {};
    if (fields.files?.[0] === "too_large") setError(t("errors.total", { mb: MAX_TOTAL_MB }));
    else
      setError(
        fields.files?.[0] ??
          fields.link?.[0] ??
          fields.non_field_errors?.[0] ??
          result.message ??
          t("errors.network"),
      );
  }

  const busy = progress !== null;

  return (
    <form className="hw-form" onSubmit={(event) => void submit(event)} noValidate>
      <p className="hw-form__title">{title ?? (again ? t("answerAgain") : t("answer"))}</p>

      <label className="hw-field">
        <span>{t("text")}</span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          maxLength={5000}
          placeholder={t("textPlaceholder")}
        />
      </label>

      {showCode ? (
        <div className="hw-field">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={`${ids}-code`}>{t("code")}</label>
            <select
              aria-label={t("language")}
              value={language}
              onChange={(event) => setLanguage(event.target.value as typeof language)}
              className="hw-select"
            >
              {CODE_LANGUAGES.map((value) => (
                <option key={value} value={value}>
                  {t(`languages.${value}`)}
                </option>
              ))}
            </select>
          </div>
          <textarea
            id={`${ids}-code`}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            rows={10}
            maxLength={50000}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="hw-code"
          />
        </div>
      ) : (
        <button type="button" className="hw-add" onClick={() => setShowCode(true)}>
          <Code2 aria-hidden className="size-4" />
          {t("addCode")}
        </button>
      )}

      <label className="hw-field">
        <span>{t("link")}</span>
        <input
          type="url"
          inputMode="url"
          value={link}
          onChange={(event) => setLink(event.target.value)}
          placeholder="https://github.com/…"
          maxLength={500}
        />
      </label>

      <div className="hw-field">
        <span id={`${ids}-files`}>{t("files")}</span>
        <label className="hw-drop">
          <Paperclip aria-hidden className="size-5" />
          <span>
            {t("chooseFiles")}
            <em>{t("filesHint", { count: MAX_FILES, mb: MAX_FILE_MB })}</em>
          </span>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept={ALLOWED_EXTENSIONS.join(",")}
            aria-describedby={`${ids}-files`}
            onChange={(event) => addFiles(event.target.files)}
            className="sr-only"
          />
        </label>
        {files.length > 0 && (
          <ul className="hw-picked">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`}>
                {previews[index] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[index] ?? ""} alt="" className="hw-picked__thumb" />
                ) : (
                  <Paperclip aria-hidden className="size-4 shrink-0" />
                )}
                <span className="truncate">{file.name}</span>
                <span className="hw-file__size">{fileSize(file.size)}</span>
                <button
                  type="button"
                  aria-label={t("removeFile", { name: file.name })}
                  onClick={() => setFiles(files.filter((_, position) => position !== index))}
                  className="hw-picked__remove"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {busy && (
        <div
          className="hw-progress"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("uploading")}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {busy ? t("uploadingPercent", { percent: progress ?? 0 }) : sent ? t("sent") : ""}
      </p>
      {error && (
        <p role="alert" className="hw-error">
          {error}
        </p>
      )}

      <Button type="submit" disabled={busy} className="h-11 w-fit gap-2 rounded-full px-5">
        <Send aria-hidden />
        {t("submit")}
      </Button>
    </form>
  );
}
