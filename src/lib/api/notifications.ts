import "server-only";

import { cache } from "react";

import type { components } from "./schema";
import { userApi } from "./server";

type Schemas = components["schemas"];

export type Notification = Schemas["Notification"];
export type NotificationSettings = Schemas["NotificationSettings"];

const TIMEOUT_MS = 5000;
/** Sahifada oxirgi xabarlar; eskilari kerak bo'lsa — keyinroq "yana" tugmasi. */
const PAGE_SIZE = 50;

export const getNotifications = cache(async (locale: string): Promise<Notification[]> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/notifications/", {
      params: { query: { page_size: PAGE_SIZE } },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data?.results ?? [];
  } catch {
    return [];
  }
});

/** Telegram holati va rozilik. Backend javob bermasa — `null` (karta ko'rsatilmaydi). */
export const getNotificationSettings = cache(
  async (locale: string): Promise<NotificationSettings | null> => {
    try {
      const api = await userApi(locale);
      const { data } = await api.GET("/api/v1/me/notifications/", {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return data ?? null;
    } catch {
      return null;
    }
  },
);
