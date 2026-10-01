/**
 * Jadval sanalari. Formatlash serverda (brauzerlarda o'zbekcha oy nomlari yo'q), kunlar esa
 * Toshkent vaqti bo'yicha solishtiriladi: "bugun" server qayerda turganiga bog'liq bo'lmasin.
 */
export const ZONE = "Asia/Tashkent";

/** "2026-10-05" — Toshkent bo'yicha kun. */
export function dayKey(value: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

/** Bugun, ertaga yoki boshqa kun (sarlavha uchun). */
export function relativeDay(
  value: Date | string,
  now: Date = new Date(),
): "today" | "tomorrow" | null {
  const key = dayKey(value);
  if (key === dayKey(now)) return "today";
  if (key === dayKey(new Date(now.getTime() + 24 * 60 * 60 * 1000))) return "tomorrow";
  return null;
}

/** Darslarni kunlar bo'yicha guruhlaydi (tartib saqlanadi). */
export function byDay<T extends { starts_at: string }>(items: T[]): { day: string; items: T[] }[] {
  const groups: { day: string; items: T[] }[] = [];
  for (const item of items) {
    const day = dayKey(item.starts_at);
    const last = groups.at(-1);
    if (last?.day === day) last.items.push(item);
    else groups.push({ day, items: [item] });
  }
  return groups;
}
