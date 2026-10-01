import "server-only";

import { cache } from "react";

import type { components } from "./schema";
import { userApi } from "./server";

type Schemas = components["schemas"];

export type Shop = Schemas["Shop"];
export type Product = Schemas["Product"];
export type Purchase = Schemas["Purchase"];

const TIMEOUT_MS = 5000;

/** Sotuvdagi sovg'alar va coin balansi. Xatoda — `null`. */
export const getShop = cache(async (locale: string): Promise<Shop | null> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/shop/", { signal: AbortSignal.timeout(TIMEOUT_MS) });
    return data ?? null;
  } catch {
    return null;
  }
});

/** Buyurtmalarim (yangilari tepada). Xatoda — bo'sh ro'yxat. */
export const getMyPurchases = cache(async (locale: string): Promise<Purchase[]> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/shop/orders/", {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? [];
  } catch {
    return [];
  }
});
