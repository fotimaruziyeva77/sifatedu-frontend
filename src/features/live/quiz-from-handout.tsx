"use client";

import { FileUp, Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { uploadAnswer } from "@/features/homework/upload";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/schema";

type Draft = components["schemas"]["QuizDraft"];
type CourseLesson = components["schemas"]["CourseLesson"];
type Result = { count: number; covered: boolean; notified: boolean } | null;

const NEW_TOPIC = "new";
const MAX_MB = 20;
const ACCEPT = ".pdf,.docx,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp";
const POLL_MS = 3000;

/**
 * Qo'llanmadan test: o'qituvchi darsda ishlatgan faylni yuklaydi → AI (Gemini) 12 ta savol
 * tuzadi (30–60 s, sahifa holatni so'rab turadi) → o'qituvchi «Tez kiritish» matnini tuzatadi →
 * «E'lon qilish»: savollar mavzu testiga qo'shiladi, mavzu «o'tildi» bo'ladi, o'quvchilarga xabar.
 */
export function QuizFromHandout({
  lessonId,
  lessons,
  topicId,
  initial,
  aiReady,
}: {
  lessonId: number;
  lessons: CourseLesson[];
  topicId: number | null;
  initial: Draft | null;
  aiReady: boolean;
}) {
  const t = useTranslations("Schedule");
  const router = useRouter();
  const ids = useId();
  const [draft, setDraft] = useState<Draft | null>(initial);
  const [restart, setRestart] = useState(false);
  const [topic, setTopic] = useState<string>(topicId ? String(topicId) : NEW_TOPIC);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState(initial?.text ?? "");
  const [share, setShare] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const modules = [...new Set(lessons.map((lesson) => lesson.module))];
  const status = draft?.status;
  const mode = restart || !draft || status === "FAILED" ? "form" : status;

  // AI tuzayotganda holat so'rab turiladi.
  useEffect(() => {
    if (status !== "PENDING" || !draft) return;
    const id = draft.id;
    const timer = window.setInterval(async () => {
      try {
        const { data } = await api.GET("/api/v1/teacher/quiz-drafts/{id}/", {
          params: { path: { id } },
        });
        if (data && data.status !== "PENDING") {
          setDraft(data);
          setText(data.text);
        }
      } catch {
        // tarmoq uzilsa — keyingi urinishda
      }
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [status, draft]);

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!file) return setError(t("aiPickFile"));
    if (file.size > MAX_MB * 1024 * 1024) return setError(t("aiTooBig", { mb: MAX_MB }));
    if (topic === NEW_TOPIC && !title.trim()) return setError(t("aiNeedTitle"));
    const form = new FormData();
    form.append("file", file, file.name);
    if (topic === NEW_TOPIC) form.append("new_title", title.trim());
    else form.append("lesson", topic);
    setProgress(0);
    const sent = await uploadAnswer(
      `/api/v1/teacher/live/${lessonId}/quiz-drafts/`,
      form,
      setProgress,
    );
    setProgress(null);
    if (sent.ok) {
      setDraft(sent.data as Draft);
      setRestart(false);
      setResult(null);
      setFile(null);
      return;
    }
    // 413 (nginx) — fayl juda katta; aks holda serverning birinchi xato matni.
    if (sent.fields?.files) return setError(t("aiTooBig", { mb: MAX_MB }));
    const first = Object.values(sent.fields ?? {}).flat()[0];
    setError(first ?? sent.message ?? t("errors.network"));
  }

  async function publish() {
    if (!draft) return;
    setBusy(true);
    setProblems([]);
    setError(null);
    try {
      const { data, error: failure } = await api.POST("/api/v1/teacher/quiz-drafts/{id}/publish/", {
        params: { path: { id: draft.id } },
        body: { text, share_file: share },
      });
      if (data) {
        setDraft(data.draft);
        setResult({ count: data.count, covered: data.covered, notified: data.notified });
        router.refresh();
        return;
      }
      const details = readApiError(failure);
      const lines = details?.fields?.text;
      if (lines?.length) setProblems(lines);
      else
        setError(details?.fields?.non_field_errors?.[0] ?? details?.message ?? t("errors.server"));
    } catch {
      setError(t("errors.network"));
    } finally {
      setBusy(false);
    }
  }

  if (!aiReady) return <p className="qd__note">{t("aiNoKey")}</p>;

  return (
    <div className="qd">
      <p className="text-sm text-pretty text-muted-foreground">{t("aiHint")}</p>

      {mode === "form" && (
        <form className="qd__form" onSubmit={(event) => void generate(event)} noValidate>
          {draft?.status === "FAILED" && !restart && (
            <p role="alert" className="live-error">
              {t("aiFailed", { error: draft.error })}
            </p>
          )}
          <label className="hw-field">
            <span>{t("aiTopic")}</span>
            <select
              className="hw-select"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              disabled={progress !== null}
            >
              <option value={NEW_TOPIC}>{t("aiNewTopic")}</option>
              {modules.map((module) => (
                <optgroup key={module} label={module}>
                  {lessons
                    .filter((lesson) => lesson.module === module)
                    .map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.covered ? `✓ ${lesson.title}` : lesson.title}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          {topic === NEW_TOPIC && (
            <label className="hw-field">
              <span>{t("aiNewTitle")}</span>
              <input
                type="text"
                value={title}
                maxLength={200}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("aiNewTitleHint")}
                disabled={progress !== null}
              />
            </label>
          )}
          <label className="hw-field" htmlFor={`${ids}-file`}>
            <span>{t("aiFile")}</span>
          </label>
          <input
            id={`${ids}-file`}
            type="file"
            accept={ACCEPT}
            className="qd__file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            disabled={progress !== null}
          />
          {error && (
            <p role="alert" className="live-error">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={progress !== null}
            className="h-11 gap-2 rounded-full px-5"
          >
            {progress !== null ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : (
              <Sparkles aria-hidden className="size-4" />
            )}
            {progress !== null ? t("aiUploading", { percent: progress }) : t("aiGenerate")}
          </Button>
        </form>
      )}

      {mode === "PENDING" && draft && (
        <p role="status" className="qd__pending">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          {t("aiPending", { file: draft.file_name })}
        </p>
      )}

      {mode === "READY" && draft && (
        <div className="qd__review">
          <p className="qd__meta">
            {t("aiDraftFor", { title: draft.lesson_title, file: draft.file_name })}
          </p>
          <p className="text-sm text-pretty text-muted-foreground">{t("aiReviewHint")}</p>
          <label className="sr-only" htmlFor={`${ids}-text`}>
            {t("aiQuestions")}
          </label>
          <textarea
            id={`${ids}-text`}
            className="qd__text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={18}
            spellCheck={false}
          />
          {problems.length > 0 && (
            <div role="alert" className="qd__errors">
              <p>{t("aiFix")}</p>
              <ul>
                {problems.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          {error && (
            <p role="alert" className="live-error">
              {error}
            </p>
          )}
          <label className="qd__share">
            <input
              type="checkbox"
              checked={share}
              onChange={(event) => setShare(event.target.checked)}
            />
            {t("aiShare")}
          </label>
          <div className="qd__actions">
            <Button
              type="button"
              onClick={() => void publish()}
              disabled={busy}
              className="h-11 gap-2 rounded-full px-5"
            >
              {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
              {t("aiPublish")}
            </Button>
            <button type="button" className="qd__link" onClick={() => setRestart(true)}>
              {t("aiAgain")}
            </button>
          </div>
        </div>
      )}

      {mode === "PUBLISHED" && draft && (
        <div className="qd__done">
          <p role="status" className="live-ok">
            {!result
              ? t("aiPublished", { count: draft.count, title: draft.lesson_title })
              : result.notified
                ? t("aiPublishedCovered", { count: result.count })
                : result.covered
                  ? t("aiPublishedOpen", { count: result.count })
                  : t("aiPublishedLater", { count: result.count })}
          </p>
          <button type="button" className="qd__link" onClick={() => setRestart(true)}>
            <FileUp aria-hidden className="size-4" />
            {t("aiAgain")}
          </button>
        </div>
      )}
    </div>
  );
}
