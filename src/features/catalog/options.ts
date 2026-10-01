/** Katalog filtrlari: daraja va saralash variantlari (server va client uchun umumiy). */
export const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const SORTS = ["popular", "new", "price", "-price"] as const;

export type CourseLevel = (typeof LEVELS)[number];
export type CourseSort = (typeof SORTS)[number];

/** URL'dagi qiymat ruxsat etilganlardan bo'lsagina ishlatiladi (begona qiymat e'tiborsiz). */
export function oneOf<T extends string>(allowed: readonly T[], value?: string): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}
