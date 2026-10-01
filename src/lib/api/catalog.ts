import "server-only";

import { cache } from "react";

import { LEVELS, oneOf, SORTS } from "@/features/catalog/options";

import type { components } from "./schema";
import { publicApi } from "./server";

type Schemas = components["schemas"];

export type CourseCard = Schemas["CourseCard"];
export type CourseDetail = Schemas["CourseDetail"];
export type Category = Schemas["Category"];
export type CourseModule = Schemas["Module"];

/** Katalogdagi filtr va saralash holati (URL query bilan bir xil). */
export type CatalogQuery = {
  q?: string;
  category?: string;
  level?: string;
  sort?: string;
  page?: string;
};

export type CourseList = Schemas["PaginatedCourseCardList"];

const TIMEOUT_MS = 5000;
export const PAGE_SIZE = 9;

const EMPTY: CourseList = { results: [], count: 0, next: null, previous: null };

/** Kategoriyalar (faqat kursi borlari). Backend ishlamasa — bo'sh ro'yxat. */
export const getCategories = cache(async (locale: string): Promise<Category[]> => {
  try {
    const { data } = await publicApi.GET("/api/v1/categories/", {
      params: { header: { "Accept-Language": locale } },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? [];
  } catch {
    return [];
  }
});

export async function getCourses(locale: string, query: CatalogQuery): Promise<CourseList> {
  try {
    const { data } = await publicApi.GET("/api/v1/courses/", {
      params: {
        header: { "Accept-Language": locale },
        query: {
          // Bo'sh qiymatlar yuborilmaydi: URL toza qoladi va kesh kaliti barqaror bo'ladi.
          ...(query.q ? { q: query.q } : {}),
          ...(query.category ? { category: query.category } : {}),
          level: oneOf(LEVELS, query.level),
          sort: oneOf(SORTS, query.sort),
          page: Number(query.page) > 1 ? Number(query.page) : undefined,
          page_size: PAGE_SIZE,
        },
      },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

export async function getCourse(locale: string, slug: string): Promise<CourseDetail | null> {
  try {
    const { data } = await publicApi.GET("/api/v1/courses/{slug}/", {
      params: { path: { slug }, header: { "Accept-Language": locale } },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? null;
  } catch {
    return null;
  }
}

/** `sitemap.xml` uchun barcha nashr qilingan kurslar (sahifalashsiz). */
export const getAllCourseSlugs = cache(async (): Promise<string[]> => {
  try {
    const { data } = await publicApi.GET("/api/v1/courses/", {
      params: { query: { page_size: 100 } },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data?.results.map((course) => course.slug) ?? [];
  } catch {
    return [];
  }
});
