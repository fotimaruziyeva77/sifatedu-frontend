import "server-only";

import { cache } from "react";

import type { components } from "./schema";
import { userApi } from "./server";

type Schemas = components["schemas"];

export type TeacherGroup = Schemas["TeacherGroup"];
export type TeacherGroupDetail = Schemas["TeacherGroupDetail"];
export type TeacherStudent = Schemas["TeacherStudent"];

const TIMEOUT_MS = 5000;

/** O'qituvchining guruhlari. O'qituvchi emas (403) yoki backend javob bermasa — `null`. */
export const getTeacherGroups = cache(async (locale: string): Promise<TeacherGroup[] | null> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/teacher/groups/", {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? null;
  } catch {
    return null;
  }
});

/** Guruh sahifasi. Boshqa o'qituvchining guruhi yoki yo'q guruh — `null`. */
export const getTeacherGroup = cache(
  async (locale: string, id: number): Promise<TeacherGroupDetail | null> => {
    try {
      const api = await userApi(locale);
      const { data } = await api.GET("/api/v1/teacher/groups/{id}/", {
        params: { path: { id } },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return data ?? null;
    } catch {
      return null;
    }
  },
);
