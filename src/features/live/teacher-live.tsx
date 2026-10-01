"use client";

import { Check, Loader2, Undo2, UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/schema";
import { initials } from "@/lib/format";

type Status = components["schemas"]["AttendanceStatusEnum"];
type Student = components["schemas"]["RosterItem"];
type CourseLesson = components["schemas"]["CourseLesson"];
type Message = { kind: "ok" | "error"; text: string } | null;

const STATUSES: Status[] = ["PRESENT", "LATE", "ABSENT", "EXCUSED"];

function problemOf(body: unknown): string | null {
  const error = readApiError(body);
  return error?.fields?.non_field_errors?.[0] ?? (error?.message || null);
}

function Feedback({ message }: { message: Message }) {
  if (!message) return null;
  return (
    <p
      role={message.kind === "error" ? "alert" : "status"}
      className={message.kind === "error" ? "live-error" : "live-ok"}
    >
      {message.text}
    </p>
  );
}

/**
 * Davomat: har o'quvchi uchun 4 holat. "Qo'shilish"ni bosganlar oldindan "Keldi" — o'qituvchi
 * saqlaganda tasdiqlanadi. Kelmaganlarga xabar dars tugagach boradi (xatoni tuzatishga ulgurasiz).
 */
export function AttendanceSheet({
  lessonId,
  students,
  joined,
  canMark,
}: {
  lessonId: number;
  students: Student[];
  /** O'quvchi ID si → "18:03" (qo'shilgan vaqti, serverda formatlangan). */
  joined: Record<number, string>;
  canMark: boolean;
}) {
  const t = useTranslations("Schedule");
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<number, Status | "">>(() =>
    Object.fromEntries(students.map((student) => [student.id, student.status])),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const locked = !canMark || busy;

  function restPresent() {
    setStatuses((current) =>
      Object.fromEntries(students.map((student) => [student.id, current[student.id] || "PRESENT"])),
    );
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const items = Object.entries(statuses)
      .filter((entry): entry is [string, Status] => entry[1] !== "")
      .map(([student, status]) => ({ student: Number(student), status }));
    if (items.length === 0) {
      setMessage({ kind: "error", text: t("markSomeone") });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { data, error } = await api.PUT("/api/v1/teacher/live/{id}/attendance/", {
        params: { path: { id: lessonId } },
        body: { items },
      });
      if (data) {
        setMessage({ kind: "ok", text: t("saved") });
        router.refresh();
      } else {
        setMessage({ kind: "error", text: problemOf(error) ?? t("errors.server") });
      }
    } catch {
      setMessage({ kind: "error", text: t("errors.network") });
    } finally {
      setBusy(false);
    }
  }

  if (students.length === 0) {
    return <p className="mt-3 text-muted-foreground">{t("noStudents")}</p>;
  }

  return (
    <form className="attn" onSubmit={(event) => void save(event)} noValidate>
      {!canMark && <p className="live-notice">{t("markLater")}</p>}
      <ul className="attn-list">
        {students.map((student) => (
          <li key={student.id} className="attn-row">
            <span aria-hidden className="teach-avatar">
              {initials(student.name)}
            </span>
            <div className="attn-row__who">
              <p className="font-medium">{student.name}</p>
              {joined[student.id] && (
                <p className="text-xs text-muted-foreground">
                  {t("joinedAt", { time: joined[student.id] })}
                </p>
              )}
            </div>
            <div
              role="radiogroup"
              aria-label={t("statusFor", { name: student.name })}
              className="attn-choices"
            >
              {STATUSES.map((status) => (
                <label key={status} className="attn-choice" data-status={status}>
                  <input
                    type="radio"
                    name={`attendance-${student.id}`}
                    value={status}
                    checked={statuses[student.id] === status}
                    onChange={() => setStatuses({ ...statuses, [student.id]: status })}
                    disabled={locked}
                  />
                  <span>{t(`attendance.${status}`)}</span>
                </label>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={restPresent}
          disabled={locked}
          className="h-11 gap-2 rounded-full px-4"
        >
          <UserCheck aria-hidden className="size-4" />
          {t("restPresent")}
        </Button>
        <Button type="submit" disabled={locked} className="h-11 gap-2 rounded-full px-5">
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {t("saveAttendance")}
        </Button>
      </div>
      <Feedback message={message} />
    </form>
  );
}

/**
 * "Dars o'tildi": mavzu (kurs darsi) tanlanadi — offlayn guruhda shu darsgacha test va uy
 * vazifalari o'quvchilarga ochiladi, ularga xabar boradi.
 */
export function CoverPanel({
  lessonId,
  lessons,
  topicId,
  covered,
  canUncover,
  canMark,
}: {
  lessonId: number;
  lessons: CourseLesson[];
  topicId: number | null;
  covered: boolean;
  canUncover: boolean;
  canMark: boolean;
}) {
  const t = useTranslations("Schedule");
  const router = useRouter();
  const selectId = useId();
  const nextOpen = lessons.find((lesson) => !lesson.covered)?.id ?? lessons[0]?.id;
  const [selected, setSelected] = useState<number | undefined>(topicId ?? nextOpen);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const topic = lessons.find((lesson) => lesson.id === topicId);
  const modules = [...new Set(lessons.map((lesson) => lesson.module))];

  async function send(method: "POST" | "DELETE") {
    setBusy(true);
    setMessage(null);
    try {
      const path = { params: { path: { id: lessonId } } };
      const { data, error } =
        method === "POST"
          ? await api.POST("/api/v1/teacher/live/{id}/covered/", {
              ...path,
              body: { lesson: selected ?? 0 },
            })
          : await api.DELETE("/api/v1/teacher/live/{id}/covered/", path);
      if (data) {
        setMessage({ kind: "ok", text: method === "POST" ? t("coveredDone") : t("uncovered") });
        router.refresh();
      } else {
        setMessage({ kind: "error", text: problemOf(error) ?? t("errors.server") });
      }
    } catch {
      setMessage({ kind: "error", text: t("errors.network") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cover">
      <p className="text-sm text-pretty text-muted-foreground">{t("coverHint")}</p>
      {covered && topic && (
        <p className="cover__done">
          <Check aria-hidden className="size-4" />
          {t("coveredTopic", { title: topic.title })}
        </p>
      )}
      <div className="cover__controls">
        <label htmlFor={selectId} className="sr-only">
          {t("topic")}
        </label>
        <select
          id={selectId}
          className="hw-select cover__select"
          value={selected ?? ""}
          onChange={(event) => setSelected(Number(event.target.value))}
          disabled={!canMark || busy}
        >
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
        <Button
          type="button"
          onClick={() => void send("POST")}
          disabled={!canMark || busy || selected === undefined}
          className="h-11 gap-2 rounded-full px-5"
        >
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {t("markCovered")}
        </Button>
        {canUncover && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => void send("DELETE")}
            disabled={busy}
            className="h-11 gap-2 rounded-full px-4"
          >
            <Undo2 aria-hidden className="size-4" />
            {t("undoCovered")}
          </Button>
        )}
      </div>
      {!canMark && <p className="text-sm text-muted-foreground">{t("markLater")}</p>}
      <Feedback message={message} />
    </div>
  );
}

/** O'quvchilarga izoh (nima o'tildi) va dars yozuvi havolasi. */
export function DetailsForm({
  lessonId,
  notes: initialNotes,
  recording: initialRecording,
}: {
  lessonId: number;
  notes: string;
  recording: string;
}) {
  const t = useTranslations("Schedule");
  const router = useRouter();
  const ids = useId();
  const [notes, setNotes] = useState(initialNotes);
  const [recording, setRecording] = useState(initialRecording);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const { data, error } = await api.PATCH("/api/v1/teacher/live/{id}/", {
        params: { path: { id: lessonId } },
        body: { notes, recording_url: recording.trim() },
      });
      if (data) {
        setMessage({ kind: "ok", text: t("saved") });
        router.refresh();
      } else {
        const fields = readApiError(error)?.fields;
        setMessage({
          kind: "error",
          text: fields?.recording_url?.[0] ?? problemOf(error) ?? t("errors.server"),
        });
      }
    } catch {
      setMessage({ kind: "error", text: t("errors.network") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => void save(event)} noValidate>
      <div className="hw-field">
        <label htmlFor={`${ids}-notes`}>{t("notesLabel")}</label>
        <textarea
          id={`${ids}-notes`}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={t("notesPlaceholder")}
        />
      </div>
      <div className="hw-field">
        <label htmlFor={`${ids}-recording`}>{t("recordingLabel")}</label>
        <input
          id={`${ids}-recording`}
          type="url"
          inputMode="url"
          value={recording}
          onChange={(event) => setRecording(event.target.value)}
          placeholder="https://youtu.be/…"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">{t("recordingHint")}</p>
      </div>
      <Button type="submit" disabled={busy} className="h-11 w-fit gap-2 rounded-full px-5">
        {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {t("saveDetails")}
      </Button>
      <Feedback message={message} />
    </form>
  );
}

/** Hali boshlanmagan darsni bekor qilish: sabab o'quvchilarga xabarda boradi. */
export function CancelForm({ lessonId }: { lessonId: number }) {
  const t = useTranslations("Schedule");
  const router = useRouter();
  const inputId = useId();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  async function cancel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm(t("cancelConfirm"))) return;
    setBusy(true);
    setMessage(null);
    try {
      const { data, error } = await api.POST("/api/v1/teacher/live/{id}/cancel/", {
        params: { path: { id: lessonId } },
        body: { reason: reason.trim() },
      });
      if (data) router.refresh();
      else setMessage({ kind: "error", text: problemOf(error) ?? t("errors.server") });
    } catch {
      setMessage({ kind: "error", text: t("errors.network") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={(event) => void cancel(event)} noValidate>
      <div className="hw-field">
        <label htmlFor={inputId}>{t("cancelReason")}</label>
        <input
          id={inputId}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={200}
          placeholder={t("cancelPlaceholder")}
        />
      </div>
      <Button
        type="submit"
        variant="outline"
        disabled={busy}
        className="live-danger h-11 w-fit gap-2 rounded-full px-5"
      >
        {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {t("cancelButton")}
      </Button>
      <Feedback message={message} />
    </form>
  );
}
