import "server-only";

import { cache } from "react";

import type { components } from "./schema";
import { userApi } from "./server";

type Schemas = components["schemas"];

export type DailyOverview = Schemas["DailyOverview"];
export type DailyGroup = Schemas["DailyGroup"];
export type DailyRow = Schemas["DailyRow"];
export type DailyReview = Schemas["DailyReview"];
export type TeacherDaily = Schemas["TeacherDaily"];

const TIMEOUT_MS = 5000;

/** O'quvchining guruhlari: bugungi test, kunlik va haftalik reyting, oxirgi natijalar. */
export const getDailyTest = cache(async (locale: string): Promise<DailyOverview | null> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/daily-test/", {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? null;
  } catch {
    return null;
  }
});

/** Javoblar va izohlar: o'z urinishi va test yopilgach. Aks holda — `null`. */
export const getDailyReview = cache(
  async (locale: string, id: number): Promise<DailyReview | null> => {
    try {
      const api = await userApi(locale);
      const { data } = await api.GET("/api/v1/daily-test/attempts/{id}/", {
        params: { path: { id } },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return data ?? null;
    } catch {
      return null;
    }
  },
);

/** O'qituvchi: guruhda kim ishladi va kim ishlamadi (kun bo'yicha). Ruxsat yo'q — `null`. */
export const getTeacherDaily = cache(
  async (locale: string, group: number, day?: string): Promise<TeacherDaily | null> => {
    try {
      const api = await userApi(locale);
      const { data } = await api.GET("/api/v1/teacher/groups/{id}/daily-test/", {
        params: { path: { id: group }, query: day ? { day } : {} },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return data ?? null;
    } catch {
      return null;
    }
  },
);
