import "server-only";

import { cache } from "react";

import type { components } from "./schema";
import { userApi } from "./server";

type Schemas = components["schemas"];

export type MyCourse = Schemas["MyCourse"];
export type MyCourseDetail = Schemas["MyCourseDetail"];
export type MyModule = Schemas["MyModule"];
export type MyLesson = Schemas["MyLesson"];
export type LessonPlayer = Schemas["LessonPlayer"];

const TIMEOUT_MS = 5000;

/** Kabinetdagi kurslar. Backend javob bermasa — bo'sh ro'yxat (sahifa buzilmaydi). */
export const getMyCourses = cache(async (locale: string): Promise<MyCourse[]> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/my/courses/", {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? [];
  } catch {
    return [];
  }
});

/** Kurs dasturi (sidebar uchun). Huquq bo'lmasa — `null`. */
export const getMyCourse = cache(
  async (locale: string, slug: string): Promise<MyCourseDetail | null> => {
    try {
      const api = await userApi(locale);
      const { data } = await api.GET("/api/v1/my/courses/{slug}/", {
        params: { path: { slug } },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return data ?? null;
    } catch {
      return null;
    }
  },
);

/** Dars sahifasi: video, progress va qo'shni darslar. Huquq bo'lmasa — `null`. */
export const getLesson = cache(async (locale: string, id: number): Promise<LessonPlayer | null> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/lessons/{id}/", {
      params: { path: { id } },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? null;
  } catch {
    return null;
  }
});
