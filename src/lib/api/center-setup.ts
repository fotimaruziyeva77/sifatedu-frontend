import "server-only";

import { cache } from "react";

import type { components } from "./schema";
import { userApi } from "./server";

export type CenterSetup = components["schemas"]["CenterSetup"];

const TIMEOUT_MS = 5000;

/** Markaz sozlamalari (faqat admin). Ruxsat bo'lmasa yoki backend javob bermasa — `null`. */
export const getCenterSetup = cache(async (locale: string): Promise<CenterSetup | null> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/center/setup/", {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? null;
  } catch {
    return null;
  }
});
