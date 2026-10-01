/** Oylik imtihon: taymer va savollar orasida yurish (sof funksiyalar — Vitest bilan tekshiriladi). */

/** Qolgan vaqt: 754 → "12:34", 3725 → "1:02:05". Manfiy — "00:00". */
export function clock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${pad(minutes)}:${pad(rest)}`;
}

/**
 * Keyingi javobsiz savol: `from` dan keyingisi, oxiriga yetsa — boshidan (o'tkazib yuborilganlar
 * uchun). `from` ning o'zi faqat boshqa javobsiz savol qolmaganda qaytadi; hammasi javoblangan
 * bo'lsa — -1.
 */
export function nextOpen(ids: readonly number[], answered: ReadonlySet<number>, from: number) {
  for (let step = 1; step <= ids.length; step += 1) {
    const index = (from + step) % ids.length;
    if (!answered.has(ids[index])) return index;
  }
  return -1;
}

/** Birinchi javobsiz savol (hammasi javoblangan — 0: yakunlash tugmasi ko'rinadi). */
export function firstOpen(ids: readonly number[], answered: ReadonlySet<number>): number {
  const index = ids.findIndex((id) => !answered.has(id));
  return index === -1 ? 0 : index;
}

/** Vaqt ogohlantirishi: 5 va 1 daqiqa qolganda (ekran o'quvchiga bir marta aytiladi). */
export function timeWarning(seconds: number): "five" | "one" | null {
  if (seconds <= 60) return "one";
  if (seconds <= 300) return "five";
  return null;
}
