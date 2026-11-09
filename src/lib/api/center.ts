import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import type { components } from "./schema";
import { publicApi } from "./server";

export type Center = components["schemas"]["CenterInfo"];
export type Feature = Center["features"][number];

const TIMEOUT_MS = 5000;
// Backend javob bermasa, bo'limlar yashirilmaydi: sahifalar o'z xatosini o'zi ko'rsatadi.
const UNKNOWN: Center = {
  state: "active",
  features: ["lessons", "exams", "placement", "rewards", "ai", "video", "bot", "click"],
};

/** O'quv markazining holati va tarifidagi bo'limlar (bitta so'rov ichida bir marta). */
export const getCenter = cache(async (): Promise<Center> => {
  try {
    const { data } = await publicApi.GET("/api/v1/center/", {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? UNKNOWN;
  } catch {
    return UNKNOWN;
  }
});

/** Bo'lim sahifasi: tarifga kirmagan bo'lsa — 404. */
export async function requireFeature(feature: Feature): Promise<void> {
  const center = await getCenter();
  if (!center.features.includes(feature)) notFound();
}
