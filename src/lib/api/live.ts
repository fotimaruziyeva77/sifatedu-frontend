import "server-only";

import { cache } from "react";

import type { components } from "./schema";
import { userApi } from "./server";

type Schemas = components["schemas"];

export type LiveLesson = Schemas["LiveLesson"];
export type TeacherLive = Schemas["TeacherLive"];
export type AttendanceStatus = Schemas["AttendanceStatusEnum"];

const TIMEOUT_MS = 5000;

/** Jadval: yaqin 14 kun (ketayotgani ham) yoki oxirgi 30 kun. Backend javob bermasa — bo'sh. */
export const getSchedule = cache(
  async (locale: string, when: "upcoming" | "past"): Promise<LiveLesson[]> => {
    try {
      const api = await userApi(locale);
      const { data } = await api.GET("/api/v1/live/", {
        params: { query: { when } },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return data ?? [];
    } catch {
      return [];
    }
  },
);

/** O'qituvchining dars sahifasi. Boshqa guruhning darsi yoki yo'q dars — `null`. */
export const getTeacherLive = cache(
  async (locale: string, id: number): Promise<TeacherLive | null> => {
    try {
      const api = await userApi(locale);
      const { data } = await api.GET("/api/v1/teacher/live/{id}/", {
        params: { path: { id } },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return data ?? null;
    } catch {
      return null;
    }
  },
);
