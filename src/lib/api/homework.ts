import "server-only";

import { cache } from "react";

import type { components } from "./schema";
import { userApi } from "./server";

type Schemas = components["schemas"];

export type Homework = Schemas["Homework"];
export type HomeworkItem = Schemas["MyHomeworkItem"];
export type Submission = Schemas["Submission"];
export type ReviewList = Schemas["ReviewList"];
export type ReviewCard = Schemas["ReviewCard"];
export type ReviewDetail = Schemas["ReviewDetail"];

const TIMEOUT_MS = 5000;

/** "Vazifalar" sahifasi. Backend javob bermasa — bo'sh ro'yxat. */
export const getMyHomework = cache(async (locale: string): Promise<HomeworkItem[]> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/homework/", {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? [];
  } catch {
    return [];
  }
});

/** Tekshirish navbati. O'qituvchi bo'lmasa (403) — `null`. */
export const getReviews = cache(
  async (
    locale: string,
    status: "pending" | "reviewed",
    group: number | null,
  ): Promise<ReviewList | null> => {
    try {
      const api = await userApi(locale);
      const { data } = await api.GET("/api/v1/teacher/reviews/", {
        params: { query: { status, ...(group ? { group } : {}) } },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return data ?? null;
    } catch {
      return null;
    }
  },
);

/** Javob sahifasi. Boshqa o'qituvchining o'quvchisi yoki yo'q javob — `null`. */
export const getReview = cache(async (locale: string, id: number): Promise<ReviewDetail | null> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/teacher/reviews/{id}/", {
      params: { path: { id } },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? null;
  } catch {
    return null;
  }
});
