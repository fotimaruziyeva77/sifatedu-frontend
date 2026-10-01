import "server-only";

import { cookies } from "next/headers";
import createClient from "openapi-fetch";

import type { paths } from "./schema";

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://backend:8000";

/** Ommaviy ma'lumotlar uchun (cookie'siz). Backend'ga Docker tarmog'i ichida murojaat qiladi. */
export const publicApi = createClient<paths>({ baseUrl: API_INTERNAL_URL });

/** Foydalanuvchi nomidan so'rovlar uchun: brauzerdan kelgan cookie'lar backend'ga uzatiladi. */
export async function userApi(locale?: string) {
  const cookieHeader = (await cookies()).toString();

  return createClient<paths>({
    baseUrl: API_INTERNAL_URL,
    cache: "no-store",
    headers: {
      cookie: cookieHeader,
      ...(locale ? { "accept-language": locale } : {}),
    },
  });
}
