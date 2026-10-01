"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";

/**
 * Bepul kursni boshlash: to'lov yo'q, faqat ro'yxatdan o'tgan bo'lish kerak.
 * Kirmagan foydalanuvchi kirish sahifasiga yuboriladi va kirgach shu kursga qaytadi.
 */
export function StartFreeButton({ slug, label }: { slug: string; label: string }) {
  const t = useTranslations("Course");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    const { error, response } = await api.POST("/api/v1/my/courses/{slug}/enroll/", {
      params: { path: { slug } },
      body: { slug },
    });
    if (response.status === 403) {
      router.push(`/auth/login?next=${encodeURIComponent(`/dashboard/courses/${slug}`)}`);
      return;
    }
    if (error) {
      setBusy(false);
      toast.error(t("startFreeFailed"));
      return;
    }
    router.push(`/dashboard/courses/${slug}`);
    router.refresh();
  }

  return (
    <Button
      type="button"
      data-magnetic
      disabled={busy}
      onClick={() => void start()}
      className="h-13 w-full gap-2 rounded-full text-base shadow-[0_12px_32px_-14px_var(--caret)]"
    >
      {label}
      {busy ? (
        <Loader2 aria-hidden className="size-5 animate-spin" />
      ) : (
        <ArrowRight aria-hidden className="size-5" />
      )}
    </Button>
  );
}
