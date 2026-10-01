import { routing } from "@/i18n/routing";

const LOCALE_PREFIX = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`);

/**
 * Kirilgandan keyin qayerga borish: `?next=` yoki kabinet.
 *
 * Tashqi manzillarga (`//evil.com`, `https://…`) o'tilmaydi. Til prefiksi olib tashlanadi —
 * uni next-intl router tanlangan tilga qarab o'zi qo'shadi (aks holda `/uz/uz/...` bo'lardi).
 */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/dashboard";
  }
  return next.replace(LOCALE_PREFIX, "") || "/";
}
