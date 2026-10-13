"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/schema";

type Slot = components["schemas"]["Slot"];
type Message = { kind: "ok" | "error"; text: string } | null;

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const DURATIONS = [60, 90, 120, 150, 180] as const;
const dayKey = (day: number) => `days.${day}`;

function problemOf(body: unknown): string | null {
  const error = readApiError(body);
  return error?.fields?.non_field_errors?.[0] ?? (error?.message || null);
}

/**
 * Guruhning haftalik dars jadvali: kun, soat va davomiylik. Har dars 2 hafta oldinga o'zi
 * yaratiladi — yo'qlama shu darslarda belgilanadi, o'quvchilarga eslatma boradi.
 */
export function ScheduleEditor({ groupId, slots }: { groupId: number; slots: Slot[] }) {
  const t = useTranslations("Teaching");
  const router = useRouter();
  const ids = useId();
  const [weekday, setWeekday] = useState("0");
  const [time, setTime] = useState("18:00");
  const [duration, setDuration] = useState("90");
  const [busy, setBusy] = useState<number | "add" | null>(null);
  const [message, setMessage] = useState<Message>(null);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{2}:\d{2}$/.test(time)) {
      setMessage({ kind: "error", text: t("errors.time") });
      return;
    }
    setBusy("add");
    setMessage(null);
    try {
      const { data, error } = await api.POST("/api/v1/teacher/groups/{id}/slots/", {
        params: { path: { id: groupId } },
        body: { weekday: Number(weekday), starts_at: time, duration_min: Number(duration) },
      });
      if (data) {
        setMessage({ kind: "ok", text: t("slotAdded") });
        router.refresh();
      } else {
        setMessage({ kind: "error", text: problemOf(error) ?? t("errors.server") });
      }
    } catch {
      setMessage({ kind: "error", text: t("errors.network") });
    } finally {
      setBusy(null);
    }
  }

  async function remove(slot: Slot) {
    setBusy(slot.id);
    setMessage(null);
    try {
      const { data, error } = await api.DELETE("/api/v1/teacher/groups/{id}/slots/{slot_id}/", {
        params: { path: { id: groupId, slot_id: slot.id } },
      });
      if (data) router.refresh();
      else setMessage({ kind: "error", text: problemOf(error) ?? t("errors.server") });
    } catch {
      setMessage({ kind: "error", text: t("errors.network") });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {slots.length === 0 ? (
        <p className="mt-3 text-muted-foreground">{t("scheduleEmpty")}</p>
      ) : (
        <ul className="slot-list">
          {slots.map((slot) => (
            <li key={slot.id} className="slot-row">
              <span className="slot-row__day">{t(dayKey(slot.weekday))}</span>
              <span className="slot-row__meta">
                {slot.starts_at} · {t("minutes", { count: slot.duration_min })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={busy !== null}
                aria-label={t("removeSlot", { day: t(dayKey(slot.weekday)), time: slot.starts_at })}
                onClick={() => void remove(slot)}
              >
                {busy === slot.id ? (
                  <Loader2 aria-hidden className="animate-spin" />
                ) : (
                  <Trash2 aria-hidden />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form className="slot-form" onSubmit={(event) => void add(event)} noValidate>
        <div className="hw-field">
          <label htmlFor={`${ids}-day`}>{t("weekday")}</label>
          <select
            id={`${ids}-day`}
            className="roster-input"
            value={weekday}
            onChange={(event) => setWeekday(event.target.value)}
          >
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {t(dayKey(day))}
              </option>
            ))}
          </select>
        </div>
        <div className="hw-field">
          <label htmlFor={`${ids}-time`}>{t("time")}</label>
          <input
            id={`${ids}-time`}
            type="time"
            step={300}
            className="roster-input"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </div>
        <div className="hw-field">
          <label htmlFor={`${ids}-duration`}>{t("duration")}</label>
          <select
            id={`${ids}-duration`}
            className="roster-input"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          >
            {DURATIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {t("minutes", { count: minutes })}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={busy !== null} className="h-11 gap-2 rounded-full px-5">
          {busy === "add" ? <Loader2 aria-hidden className="animate-spin" /> : <Plus aria-hidden />}
          {t("addSlot")}
        </Button>
      </form>
      {message && (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`mt-3 ${message.kind === "error" ? "live-error" : "live-ok"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
