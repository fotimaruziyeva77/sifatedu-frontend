/** Monitoringga ketadigan matnlardan shaxsiy ma'lumotni olib tashlaydi. */

// +998 90 123 45 67, 998901234567, +998-90-123-45-67 — hammasi.
const PHONE = /\+?998[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g;
export const PHONE_MASK = "[telefon]";

export function maskPhones(text: string): string {
  return text.replace(PHONE, PHONE_MASK);
}

/** URL'dan query olib tashlanadi: unda imzo, token yoki buyurtma raqami bo'lishi mumkin. */
export function withoutQuery(path: string): string {
  const index = path.search(/[?#]/);
  return index === -1 ? path : path.slice(0, index);
}
