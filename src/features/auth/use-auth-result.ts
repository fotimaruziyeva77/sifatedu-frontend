"use client";

import { useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { useRouter } from "@/i18n/navigation";
import { safeNext } from "@/lib/safe-next";

export type AuthResult = {
  status?: string;
  first_name?: string;
  user?: { locale?: string } | null;
};

/** Telefon qadamida "Xush kelibsiz, Ali!" deb ko'rsatish uchun. */
export const SOCIAL_NAME_KEY = "sifat:social-name";

/**
 * Auth javobini qayta ishlaydi: kirdi → keyingi sahifa; telefon kerak → telefon qadami.
 * `refresh()` server komponentlarini (header, kabinet) yangi sessiya bilan qayta chizadi.
 */
export function useAuthResult() {
  const router = useRouter();
  const params = useSearchParams();

  return useCallback(
    (result: AuthResult) => {
      if (result.status === "phone_required") {
        try {
          sessionStorage.setItem(SOCIAL_NAME_KEY, result.first_name ?? "");
        } catch {
          // Sessiya xotirasi yopiq bo'lsa, sarlavha umumiy ko'rinishda qoladi.
        }
        const next = params.get("next");
        router.push(next ? `/auth/phone?next=${encodeURIComponent(next)}` : "/auth/phone");
        return;
      }
      const target = safeNext(params.get("next"));
      // Foydalanuvchi tanlagan interfeys tiliga o'tamiz.
      router.push(target, { locale: result.user?.locale });
      router.refresh();
    },
    [router, params],
  );
}
