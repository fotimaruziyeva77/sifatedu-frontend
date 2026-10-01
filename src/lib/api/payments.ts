import "server-only";

import { cache } from "react";

import type { components } from "./schema";
import { userApi } from "./server";

export type Order = components["schemas"]["Order"];

const TIMEOUT_MS = 5000;

/** Foydalanuvchining buyurtmalari. Backend javob bermasa — bo'sh ro'yxat. */
export const getMyOrders = cache(async (locale: string): Promise<Order[]> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/orders/", {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? [];
  } catch {
    return [];
  }
});
