/**
 * Content Security Policy.
 *
 * Skriptlar faqat har so'rovda yangi yaratiladigan nonce bilan ishlaydi (`'strict-dynamic'`:
 * nonce'li skript yuklagan skriptlar ham ishonchli — Google va Telegram kirish tugmalari shunday
 * yuklanadi). Inline `style` atributlariga ruxsat bor: ular skript bajara olmaydi, React esa
 * SSR paytida ko'p joyda `style="..."` yozadi.
 */

const GOOGLE = "https://accounts.google.com";
const TELEGRAM = "https://telegram.org";
const TELEGRAM_OAUTH = "https://oauth.telegram.org";

export type CspOptions = {
  nonce: string;
  /** Dev: React xatolarni ko'rsatish uchun `eval` ishlatadi, HMR esa WebSocket orqali ishlaydi. */
  dev: boolean;
  /** Storage (rasmlar, video segmentlari) va CDN manzillari. */
  storage: string[];
  /** Sentry'ning qabul qiluvchi manzili (bo'lsa). */
  reportOrigin?: string;
};

export function buildCsp({ nonce, dev, storage, reportOrigin }: CspOptions): string {
  const directives: [string, string[]][] = [
    ["default-src", ["'self'"]],
    [
      "script-src",
      [
        "'self'",
        `'nonce-${nonce}'`,
        "'strict-dynamic'",
        // `strict-dynamic`ni bilmaydigan eski brauzerlar uchun zaxira ro'yxat.
        GOOGLE,
        TELEGRAM,
        ...(dev ? ["'unsafe-eval'"] : []),
      ],
    ],
    ["style-src", ["'self'", "'unsafe-inline'", `${GOOGLE}/gsi/style`]],
    ["img-src", ["'self'", "data:", "blob:", ...storage]],
    ["font-src", ["'self'"]],
    // hls.js videoni MediaSource orqali `blob:` manzilda o'ynatadi.
    ["media-src", ["'self'", "blob:", ...storage]],
    [
      "connect-src",
      [
        "'self'",
        ...storage,
        `${GOOGLE}/gsi/`,
        ...(reportOrigin ? [reportOrigin] : []),
        ...(dev ? ["ws:"] : []),
      ],
    ],
    ["frame-src", [`${GOOGLE}/gsi/`, TELEGRAM_OAUTH]],
    // hls.js segmentlarni Web Worker'da (blob URL) ajratadi.
    ["worker-src", ["'self'", "blob:"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
  ];

  const policy = directives.map(([name, values]) => `${name} ${unique(values).join(" ")}`);
  // Local'da storage http://localhost:9000 — uni https'ga majburlab bo'lmaydi.
  if (!dev) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

/** `https://host:port/yo'l` → `https://host:port`. Noto'g'ri qiymat — tashlab yuboriladi. */
export function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** Sentry DSN'dan (`https://kalit@o1.ingest.sentry.io/2`) yuborish manzilini oladi. */
export function sentryOrigin(dsn: string | undefined): string | null {
  return originOf(dsn);
}

/** Har so'rov uchun kutilmagan nonce (128 bit). */
export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
