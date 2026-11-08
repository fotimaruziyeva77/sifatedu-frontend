import "server-only";

import { cookies, headers } from "next/headers";
import createClient, { type Middleware } from "openapi-fetch";

import type { paths } from "./schema";

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://backend:8000";

/** Backend o'quv markazini manzil bo'yicha tanlaydi: ichki so'rovda ham sayt manzili ketadi. */
const forwardHost: Middleware = {
  async onRequest({ request }) {
    const incoming = await headers();
    const host = incoming.get("x-forwarded-host") ?? incoming.get("host");
    if (host) request.headers.set("x-forwarded-host", host);
    return request;
  },
};

/** Ommaviy ma'lumotlar uchun (cookie'siz). Backend'ga Docker tarmog'i ichida murojaat qiladi. */
export const publicApi = createClient<paths>({ baseUrl: API_INTERNAL_URL });
publicApi.use(forwardHost);

/** Foydalanuvchi nomidan so'rovlar uchun: brauzerdan kelgan cookie'lar backend'ga uzatiladi. */
export async function userApi(locale?: string) {
  const cookieHeader = (await cookies()).toString();

  const client = createClient<paths>({
    baseUrl: API_INTERNAL_URL,
    cache: "no-store",
    headers: {
      cookie: cookieHeader,
      ...(locale ? { "accept-language": locale } : {}),
    },
  });
  client.use(forwardHost);
  return client;
}
