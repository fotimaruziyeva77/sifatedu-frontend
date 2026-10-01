"use client";

import { Loader2, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";

/**
 * "Olish": tasdiqlash so'raladi, coin yechiladi, buyurtma "Buyurtmalarim"ga tushadi. Coin
 * yetmasa — tugma o'chiq va qancha yetmasligi yoziladi.
 */
export function BuyGift({
  id,
  name,
  price,
  missing,
}: {
  id: number;
  name: string;
  price: number;
  /** Yetmayotgan coin (0 — yetadi). */
  missing: number;
}) {
  const t = useTranslations("Shop");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function buy() {
    if (!window.confirm(t("confirm", { name, price }))) return;
    setBusy(true);
    try {
      const { data, error } = await api.POST("/api/v1/shop/{id}/buy/", {
        params: { path: { id } },
      });
      if (data) {
        toast.success(t("bought", { name, coins: data.coins }));
        router.refresh();
      } else {
        toast.error(readApiError(error)?.fields?.non_field_errors?.[0] ?? t("errors.server"));
      }
    } catch {
      toast.error(t("errors.network"));
    } finally {
      setBusy(false);
    }
  }

  if (missing > 0) {
    return (
      <Button type="button" variant="outline" disabled className="h-10 w-full rounded-full px-4">
        {t("missing", { count: missing })}
      </Button>
    );
  }
  return (
    <Button
      type="button"
      onClick={() => void buy()}
      disabled={busy}
      className="h-10 w-full gap-2 rounded-full px-4"
      aria-label={t("buyLabel", { name })}
    >
      {busy ? <Loader2 aria-hidden className="animate-spin" /> : <ShoppingBag aria-hidden />}
      {t("buy")}
    </Button>
  );
}
