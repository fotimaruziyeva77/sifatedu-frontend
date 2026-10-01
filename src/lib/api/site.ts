import "server-only";

import { cache } from "react";

import type { components } from "./schema";
import { publicApi } from "./server";

type Schemas = components["schemas"];

export type SitePayload = Schemas["SitePayload"];
export type SiteSettings = Schemas["SiteSettings"];
export type CourseCard = Schemas["CourseCard"];
export type InstructorCard = Schemas["InstructorCard"];
export type LegalPage = Schemas["LegalPage"];

const TIMEOUT_MS = 5000;

/**
 * Landing ma'lumotlari. Backend javobni Redis'da keshlaydi, shuning uchun har so'rovda olinadi;
 * `cache` bitta so'rov ichida layout va sahifa uchun bir marta chaqiradi.
 * Backend ishlamasa `null`: sahifa ma'lumotsiz bo'limlarni ko'rsatmaydi.
 */
export const getSite = cache(async (locale: string): Promise<SitePayload | null> => {
  try {
    const { data } = await publicApi.GET("/api/v1/site/", {
      params: { header: { "Accept-Language": locale } },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? null;
  } catch {
    return null;
  }
});

export type LegalPageResult =
  { status: "ok"; page: LegalPage } | { status: "not-found" } | { status: "unavailable" };

export async function getLegalPage(slug: string, locale: string): Promise<LegalPageResult> {
  try {
    const { data, response } = await publicApi.GET("/api/v1/pages/{slug}/", {
      params: { path: { slug }, header: { "Accept-Language": locale } },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (data) return { status: "ok", page: data };
    return response.status === 404 ? { status: "not-found" } : { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}
