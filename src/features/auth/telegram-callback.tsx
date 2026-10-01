"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";

import { useAuthResult } from "./use-auth-result";

/** Telegram widget'i qaytish manziliga qo'shadigan (va imzoga kiradigan) maydonlar. */
const FIELDS = ["id", "first_name", "last_name", "username", "photo_url", "auth_date", "hash"];

/**
 * Telegram orqali kirishdan qaytish: manzildagi ma'lumotlar (imzo bilan) backend'da tekshiriladi,
 * so'ng odatdagidek — kabinet yoki telefon qadami.
 */
export function TelegramCallback() {
  const t = useTranslations("Auth");
  const params = useSearchParams();
  const handleResult = useAuthResult();
  const [error, setError] = useState<string | null>(null);
  const sent = useRef(false);
  const body = useMemo(
    () =>
      Object.fromEntries(
        FIELDS.flatMap((key) => {
          const value = params.get(key);
          return value === null ? [] : [[key, value]];
        }),
      ),
    [params],
  );
  // Imzosiz yoki chala manzil (masalan, qo'lda ochilgan) — backend'ga yuborilmaydi.
  const incomplete = !body.id || !body.hash;

  useEffect(() => {
    if (incomplete || sent.current) return;
    sent.current = true;
    void (async () => {
      try {
        const { data, error: failure } = await api.POST("/api/v1/auth/social/telegram/", {
          body: body as never,
        });
        if (data) handleResult(data);
        else setError(readApiError(failure)?.message ?? t("errors.telegramFailed"));
      } catch {
        setError(t("errors.network"));
      }
    })();
  }, [body, incomplete, handleResult, t]);

  const problem = incomplete ? t("errors.telegramFailed") : error;

  if (problem) {
    return (
      <div className="grid gap-4">
        <p role="alert" className="auth-error">
          {problem}
        </p>
        <Link href="/auth/login" className="auth-link">
          {t("loginLink")}
        </Link>
      </div>
    );
  }
  return (
    <p role="status" className="flex items-center gap-2 text-muted-foreground">
      <Loader2 aria-hidden className="size-4 animate-spin" />
      {t("telegramChecking")}
    </p>
  );
}
