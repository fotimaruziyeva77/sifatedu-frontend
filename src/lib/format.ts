/**
 * Raqamlarni guruhlab yozish. Intl ishlatilmaydi: brauzer va serverdagi ICU ma'lumotlari farq
 * qilishi mumkin (masalan, "uz" lokali yo'q brauzer), bu esa hydration xatosiga olib keladi.
 */
const GROUP_SEPARATORS: Record<string, string> = {
  uz: " ",
  ru: " ",
  en: ",",
};

/** 1490000 → "1 490 000" (uz, ru; bo'linmas bo'shliq) yoki "1,490,000" (en). */
export function formatNumber(value: number, locale: string): string {
  const separator = GROUP_SEPARATORS[locale] ?? " ";
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/** Ism-familiyadan bosh harflar: "Aziz Karimov" → "AK". */
export function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const STAMP = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Tashkent",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * "01.10.2026, 09:15" — Toshkent vaqti bilan, oy nomisiz: server ham, brauzer ham bir xil
 * chiqaradi (client komponentlarda hydration xatosi bo'lmaydi).
 */
export function stamp(iso: string): string {
  const parts = Object.fromEntries(
    STAMP.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  return `${parts.day}.${parts.month}.${parts.year}, ${parts.hour}:${parts.minute}`;
}
