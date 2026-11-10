import "server-only";

import type { components } from "./schema";
import { publicApi } from "./server";

export type PublicPlan = components["schemas"]["PublicPlan"];

const TIMEOUT_MS = 5000;

/** Sotuvdagi tariflar. Backend javob bermasa — bo'sh ro'yxat. */
export async function getPlans(): Promise<PublicPlan[]> {
  try {
    const { data } = await publicApi.GET("/api/v1/platform/plans/", {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return data ?? [];
  } catch {
    return [];
  }
}

/** Reklama matnidagi sinov muddati: birinchi tarifniki (odatda hammasida bir xil). */
export function trialDays(plans: readonly PublicPlan[]): number {
  return plans[0]?.trial_days ?? 14;
}
