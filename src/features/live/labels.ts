import type { getFormatter } from "next-intl/server";

type Formatter = Awaited<ReturnType<typeof getFormatter>>;

/** Server komponentlarida: "18:00". Toshkent vaqti next-intl sozlamasidan olinadi. */
export function clock(format: Formatter, value: string): string {
  return format.dateTime(new Date(value), { hour: "2-digit", minute: "2-digit" });
}

/** "18:00–19:30" */
export function timeRange(format: Formatter, starts: string, ends: string): string {
  return `${clock(format, starts)}–${clock(format, ends)}`;
}

/** "Payshanba, 2-oktabr"; bugun yoki ertaga bo'lsa — oldiga "Bugun" / "Ertaga". */
export function dayLabel(format: Formatter, value: string, relative: string | null): string {
  const date = format.dateTime(new Date(value), { weekday: "long", day: "numeric", month: "long" });
  return relative ? `${relative}, ${date}` : date;
}
