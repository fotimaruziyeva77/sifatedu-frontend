"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";

type Purpose = "register" | "reset" | "link";

/**
 * SMS kod yuborish. Backend limitga tushganda qancha kutishni aytadi (`retry_after`),
 * shuning uchun taymer har doim haqiqiy qolgan vaqtni ko'rsatadi.
 */
export function useOtp() {
  const t = useTranslations("Auth");
  const [sending, setSending] = useState(false);
  const [resendUntil, setResendUntil] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sendCode = useCallback(
    async (phone: string, purpose: Purpose): Promise<boolean> => {
      setSending(true);
      setError(null);
      try {
        const {
          data,
          error: failure,
          response,
        } = await api.POST("/api/v1/auth/otp/", {
          body: { phone, purpose },
        });
        if (data) {
          setResendUntil(Date.now() + data.resend_in * 1000);
          return true;
        }
        const parsed = readApiError(failure);
        // Limit: kod baribir yuborilgan bo'lishi mumkin, shuning uchun qadam almashadi.
        if (response.status === 429) {
          setResendUntil(Date.now() + (parsed?.retry_after ?? 60) * 1000);
          setError(parsed?.message ?? null);
          return true;
        }
        setError(parsed?.fields?.phone?.[0] ?? parsed?.message ?? t("errors.server"));
        return false;
      } catch {
        setError(t("errors.network"));
        return false;
      } finally {
        setSending(false);
      }
    },
    [t],
  );

  return { sendCode, sending, resendUntil, error, setError };
}
