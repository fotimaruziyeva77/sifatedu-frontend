import "server-only";

import { cache } from "react";

import type { components } from "./schema";
import { publicApi, userApi } from "./server";

type Schemas = components["schemas"];

export type ExamCard = Schemas["ExamCard"];
export type ExamDetail = Schemas["ExamDetail"];
export type TeacherExam = Schemas["TeacherExam"];
export type TeacherExamDetail = Schemas["TeacherExamDetail"];
export type Certificate = Schemas["Certificate"];
export type MyCertificates = Schemas["MyCertificates"];

const TIMEOUT_MS = 5000;

/** O'quvchining oylik imtihonlari (ochiq va yaqinda yopilganlari). Xatoda — bo'sh ro'yxat. */
export const getMyExams = cache(async (locale: string): Promise<ExamCard[]> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/exams/", { signal: AbortSignal.timeout(TIMEOUT_MS) });
    return data ?? [];
  } catch {
    return [];
  }
});

/** Imtihon sahifasi. Qatnashmaydigan o'quvchi yoki yo'q imtihon — `null`. */
export const getExam = cache(async (locale: string, id: number): Promise<ExamDetail | null> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/exams/{id}/", {
      params: { path: { id } },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? null;
  } catch {
    return null;
  }
});

/** O'qituvchi boshqaradigan imtihonlar. Xodim emas (403) — `null`. */
export const getTeacherExams = cache(async (locale: string): Promise<TeacherExam[] | null> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/teacher/exams/", {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? null;
  } catch {
    return null;
  }
});

/** Baholash sahifasi. Boshqa kursning imtihoni yoki yo'q imtihon — `null`. */
export const getTeacherExam = cache(
  async (locale: string, id: number): Promise<TeacherExamDetail | null> => {
    try {
      const api = await userApi(locale);
      const { data } = await api.GET("/api/v1/teacher/exams/{id}/", {
        params: { path: { id } },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return data ?? null;
    } catch {
      return null;
    }
  },
);

/** Sertifikatlarim va hali olinmaganlari bo'yicha shartlar. */
export const getMyCertificates = cache(async (locale: string): Promise<MyCertificates | null> => {
  try {
    const api = await userApi(locale);
    const { data } = await api.GET("/api/v1/certificates/", {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? null;
  } catch {
    return null;
  }
});

/** Ommaviy tekshirish: raqam bo'yicha sertifikat. Yo'q raqam — `null`. */
export const getCertificate = cache(
  async (locale: string, number: string): Promise<Certificate | null> => {
    try {
      const { data } = await publicApi.GET("/api/v1/certificates/{number}/", {
        params: { path: { number } },
        headers: { "accept-language": locale },
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return data ?? null;
    } catch {
      return null;
    }
  },
);
