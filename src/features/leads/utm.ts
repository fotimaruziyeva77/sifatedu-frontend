"use client";

const STORAGE_KEY = "sifat:utm";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

/** Birinchi kirishdagi UTM belgilarini sessiya davomida saqlaydi (ariza manbasini bilish uchun). */
export function captureUtm(): void {
  const params = new URLSearchParams(window.location.search);
  const utm: Utm = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) utm[key] = value.slice(0, 200);
  }
  if (Object.keys(utm).length === 0) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utm));
  } catch {
    // Brauzer saqlashga ruxsat bermasa (maxfiy rejim), UTM'siz davom etamiz.
  }
}

export function readUtm(): Utm {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Utm) : {};
  } catch {
    return {};
  }
}
