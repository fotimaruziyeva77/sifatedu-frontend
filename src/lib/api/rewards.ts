import "server-only";

import { cache } from "react";

import type { components } from "./schema";
import { userApi } from "./server";

type Schemas = components["schemas"];

export type Rewards = Schemas["Rewards"];
export type DailyTask = Schemas["DailyTask"];
export type RewardEntry = Schemas["RewardEntry"];
export type Rating = Schemas["Rating"];
export type Penalty = Schemas["Penalty"];

export type RatingPeriod = "week" | "month" | "all";

const TIMEOUT_MS = 5000;

/** Hamyon, bugungi topshiriqlar, kuponlar va oxirgi o'zgarishlar. Xatoda — `null`. */
export const getRewards = cache(async (locale: string): Promise<Rewards | null> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/rewards/", {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? null;
  } catch {
    return null;
  }
});

/** Reyting: davr va doira (kurs yoki guruh). Ruxsat yo'q doira — `null`. */
export const getRating = cache(
  async (
    locale: string,
    period: RatingPeriod,
    scope: "course" | "group" | null,
    id: number | null,
  ): Promise<Rating | null> => {
    try {
      const api = await userApi(locale);
      const { data } = await api.GET("/api/v1/rewards/rating/", {
        params: {
          query: { period, ...(scope && id ? { scope, id } : {}) },
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return data ?? null;
    } catch {
      return null;
    }
  },
);

/** O'qituvchi: guruh o'quvchilarining oxirgi 30 kundagi shtraflari. Ruxsat yo'q — bo'sh. */
export const getPenalties = cache(async (locale: string, group: number): Promise<Penalty[]> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/teacher/penalties/", {
      params: { query: { group } },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? [];
  } catch {
    return [];
  }
});
