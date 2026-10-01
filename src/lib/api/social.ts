import "server-only";

import { cache } from "react";

import type { SocialProviders } from "@/features/auth/social-sign-in";

import { publicApi } from "./server";

const EMPTY: SocialProviders = { google_client_id: "", telegram_bot: "" };

/** Qaysi ijtimoiy tugmalar sozlangan. Backend javob bermasa, tugmalar ko'rsatilmaydi. */
export const getSocialProviders = cache(async (): Promise<SocialProviders> => {
  try {
    const { data } = await publicApi.GET("/api/v1/auth/social/", {
      signal: AbortSignal.timeout(5000),
    });
    return data ?? EMPTY;
  } catch {
    return EMPTY;
  }
});
