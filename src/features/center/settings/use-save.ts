"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { type ApiError, readApiError } from "@/lib/api/errors";

type Result = { data?: unknown; error?: unknown; response: Response };

function firstMessage(error: ApiError | null): string | null {
  const field = Object.values(error?.fields ?? {})[0]?.[0];
  return field || error?.message || null;
}

/** Sozlamalarni saqlash: xato matni, tugma holati va muvaffaqiyatdan keyin sahifani yangilash. */
export function useSave() {
  const t = useTranslations("CenterSettings");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(request: () => Promise<Result>): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const { error: failure, response } = await request();
      if (!response.ok) {
        setError(firstMessage(readApiError(failure)) ?? t("errors.server"));
        return false;
      }
      toast.success(t("saved"));
      startTransition(() => router.refresh());
      return true;
    } catch {
      setError(t("errors.network"));
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { save, error, busy: saving || pending };
}
