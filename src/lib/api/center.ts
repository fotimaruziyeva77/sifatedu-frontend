import "server-only";

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";

import { FLAGSHIP_NAME } from "@/lib/rebrand-messages";

import type { components } from "./schema";
import { publicApi } from "./server";

export type CenterInfo = components["schemas"]["CenterInfo"];
/** `missing` — bu manzilda markaz yo'q (backend 404); `offline` — backend javob bermadi. */
export type Center = Omit<CenterInfo, "kind"> & {
  kind: CenterInfo["kind"] | "missing" | "offline";
};
export type Feature = Center["features"][number];

const TIMEOUT_MS = 5000;
/** Birinchi markaz manzillari (backend'dagi `FIRST_CENTER_DOMAINS`). */
const FLAGSHIP_HOSTS = (process.env.FLAGSHIP_DOMAINS ?? "")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

const EMPTY = {
  state: "active" as const,
  features: [],
  name: "",
  flagship: false,
  logo: "",
  logo_dark: "",
  color: "",
  trial: false,
  support_phone: "",
  support_telegram: "",
  base_domain: "",
  legal_pages: [],
  signup_open: false,
};
const MISSING: Center = { ...EMPTY, kind: "missing" };
const OFFLINE: Center = { ...EMPTY, kind: "offline" };
// Birinchi markaz backend javob bermaganda ham o'z ko'rinishida qoladi; bo'limlar yashirilmaydi:
// sahifalar o'z xatosini o'zi ko'rsatadi.
const FLAGSHIP_OFFLINE: Center = {
  ...EMPTY,
  kind: "center",
  name: FLAGSHIP_NAME,
  flagship: true,
  features: ["lessons", "exams", "placement", "rewards", "ai", "video", "bot", "click"],
};

/** Backend javob bermadi: brend noma'lum, shuning uchun boshqa markazlarda neytral sahifa. */
async function unreachable(): Promise<Center> {
  const incoming = await headers();
  const host = (incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "")
    .split(":")[0]
    .toLowerCase()
    .replace(/^www\./, "");
  return FLAGSHIP_HOSTS.includes(host) ? FLAGSHIP_OFFLINE : OFFLINE;
}

/** O'quv markazining holati, brendi va tarifidagi bo'limlar (bitta so'rov ichida bir marta). */
export const getCenter = cache(async (): Promise<Center> => {
  try {
    const { data, response } = await publicApi.GET("/api/v1/center/", {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status === 404) return MISSING;
    if (!data) return unreachable();
    // Platforma sayti ro'yxatdan o'tish yoqilmaguncha (`SIGNUP_OPEN`) tashqariga ko'rinmaydi:
    // nomi ham chiqmaydi, manzil bo'sh manzildek ko'rinadi.
    if (data.kind === "platform" && !data.signup_open) return MISSING;
    return data;
  } catch {
    return unreachable();
  }
});

/** Sayt o'rniga ko'rsatiladigan holat: bu manzilda sayt yo'q yoki backend javob bermayapti. */
export function unavailable(center: Center): "missing" | "offline" | null {
  return center.kind === "missing" || center.kind === "offline" ? center.kind : null;
}

/** Bo'lim sahifasi: tarifga kirmagan bo'lsa — 404. */
export async function requireFeature(feature: Feature): Promise<void> {
  const center = await getCenter();
  if (!center.features.includes(feature)) notFound();
}
