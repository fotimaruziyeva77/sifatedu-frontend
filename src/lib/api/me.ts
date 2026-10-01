import "server-only";

import { cache } from "react";

import type { components } from "./schema";
import { userApi } from "./server";

export type Me = components["schemas"]["Me"];

/** Header va kabinet uchun foydalanuvchining qisqa ko'rinishi (client komponentlarga uzatiladi). */
export type ViewerSummary = {
  firstName: string;
  fullName: string;
  phone: string;
  avatar: string | null;
};

/**
 * Joriy foydalanuvchi (brauzer cookie'si backend'ga uzatiladi). Kirmagan bo'lsa yoki backend
 * javob bermasa — `null`. `cache` bitta so'rov ichida layout va sahifa uchun bir marta chaqiradi.
 */
export const getMe = cache(async (locale: string): Promise<Me | null> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/me/", { signal: AbortSignal.timeout(5000) });
    return data ?? null;
  } catch {
    return null;
  }
});

export function toViewer(me: Me): ViewerSummary {
  return {
    firstName: me.first_name || me.full_name || me.phone,
    fullName: me.full_name || me.phone,
    phone: me.phone,
    avatar: me.avatar ?? null,
  };
}
