import createClient, { type Middleware } from "openapi-fetch";

import type { paths } from "./schema";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCookie(name: string): string | undefined {
  const entry = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : undefined;
}

/** Birinchi o'zgartiruvchi so'rovdan oldin Django `csrftoken` cookie'sini o'rnatadi. */
async function csrfToken(): Promise<string | undefined> {
  const existing = readCookie("csrftoken");
  if (existing) return existing;
  await fetch("/api/v1/auth/csrf/", { credentials: "same-origin" });
  return readCookie("csrftoken");
}

/**
 * Har bir so'rovda sayt tili yuboriladi: backend xabarlarni (masalan, SMS matnini) shu tilda
 * qaytaradi. Til `<html lang>` dan olinadi — u next-intl tomonidan o'rnatiladi.
 */
const localeMiddleware: Middleware = {
  onRequest({ request }) {
    const locale = document.documentElement.lang;
    if (locale) {
      request.headers.set("Accept-Language", locale);
    }
    return request;
  },
};

/** Django CSRF himoyasi: o'zgartiruvchi so'rovlarga cookie'dagi tokenni header sifatida qo'shadi. */
const csrfMiddleware: Middleware = {
  async onRequest({ request }) {
    if (UNSAFE_METHODS.has(request.method)) {
      const token = await csrfToken();
      if (token) {
        request.headers.set("X-CSRFToken", token);
      }
    }
    return request;
  },
};

/** Brauzer uchun: API bir xil domenda (nginx `/api/` ni backend'ga yo'naltiradi). */
export const api = createClient<paths>({
  baseUrl: "",
  credentials: "same-origin",
});
api.use(localeMiddleware);
api.use(csrfMiddleware);
