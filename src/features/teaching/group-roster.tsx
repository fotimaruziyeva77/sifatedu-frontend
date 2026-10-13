"use client";

import { Check, Copy, Loader2, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";

type Message = { kind: "ok" | "error"; text: string } | null;

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
 * Guruhga o'quvchi qo'shish: telefon va ism. Raqam tizimda bo'lmasa — akkaunt yaratiladi va
 * o'quvchi botga shu raqam bilan kirganda o'zi ulanadi (o'qituvchi unga bot havolasini yuboradi).
 */
export function AddStudent({ groupId, botUrl }: { groupId: number; botUrl: string }) {
  const t = useTranslations("Teaching");
  const router = useRouter();
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("+998 ");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [created, setCreated] = useState(false);
  const [copied, setCopied] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setCopied(false);
    try {
      const { data, error } = await api.POST("/api/v1/teacher/groups/{id}/students/", {
        params: { path: { id: groupId } },
        body: { phone, first_name: firstName, last_name: lastName },
      });
      if (data) {
        const text = data.moved_from
          ? t("addedMoved", { name: data.name, group: data.moved_from })
          : data.created
            ? t("addedNew", { name: data.name })
            : t("added", { name: data.name });
        setMessage({ kind: "ok", text });
        setCreated(data.created);
        setPhone("+998 ");
        setFirstName("");
        setLastName("");
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

  async function copyBot() {
    try {
      await navigator.clipboard.writeText(botUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} className="h-10 gap-2 rounded-full px-4">
        <UserPlus aria-hidden />
        {t("addStudent")}
      </Button>
    );
  }

  return (
    <form className="roster-form" onSubmit={(event) => void submit(event)} noValidate>
      <div>
        <h3 className="font-semibold">{t("addTitle")}</h3>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">{t("addHint")}</p>
      </div>
      <div className="roster-fields">
        <div className="hw-field">
          <label htmlFor={`${ids}-phone`}>{t("phone")}</label>
          <input
            id={`${ids}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            required
            className="roster-input"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
        <div className="hw-field">
          <label htmlFor={`${ids}-first`}>{t("firstName")}</label>
          <input
            id={`${ids}-first`}
            autoComplete="off"
            className="roster-input"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </div>
        <div className="hw-field">
          <label htmlFor={`${ids}-last`}>{t("lastName")}</label>
          <input
            id={`${ids}-last`}
            autoComplete="off"
            className="roster-input"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>
      </div>
      <Feedback message={message} />
      {message?.kind === "ok" && created && botUrl && (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <Button
            type="button"
            variant="outline"
            onClick={() => void copyBot()}
            className="h-9 gap-2 rounded-full px-3"
          >
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copied ? t("copied") : t("copyBot")}
          </Button>
          <span className="break-all text-muted-foreground">{botUrl}</span>
        </p>
      )}
      <div className="roster-actions">
        <Button type="submit" disabled={busy} className="h-10 gap-2 rounded-full px-5">
          {busy ? <Loader2 aria-hidden className="animate-spin" /> : <UserPlus aria-hidden />}
          {t("add")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOpen(false);
            setMessage(null);
          }}
          className="h-10 gap-2 rounded-full px-4"
        >
          <X aria-hidden />
          {t("close")}
        </Button>
      </div>
    </form>
  );
}

/** O'quvchini guruhdan chiqarish (tasdiq bilan): kursga kirish yopiladi, natijalar qoladi. */
export function RemoveStudent({
  groupId,
  studentId,
  name,
}: {
  groupId: number;
  studentId: number;
  name: string;
}) {
  const t = useTranslations("Teaching");
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const { data, error: failure } = await api.DELETE(
        "/api/v1/teacher/groups/{id}/students/{user_id}/",
        { params: { path: { id: groupId, user_id: studentId } } },
      );
      if (data) router.refresh();
      else setError(problemOf(failure) ?? t("errors.server"));
    } catch {
      setError(t("errors.network"));
    } finally {
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button type="button" className="roster-remove" onClick={() => setConfirming(true)}>
        {t("remove")}
      </button>
    );
  }

  return (
    <div className="mt-2 grid gap-2">
      <p className="text-sm text-pretty">{t("removeConfirm", { name })}</p>
      <div className="roster-actions">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={busy}
          onClick={() => void remove()}
        >
          {busy && <Loader2 aria-hidden className="animate-spin" />}
          {t("removeYes")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
          {t("cancel")}
        </Button>
      </div>
      {error && (
        <p role="alert" className="live-error">
          {error}
        </p>
      )}
    </div>
  );
}
