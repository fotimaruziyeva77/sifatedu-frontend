"use client";

import { ArrowRight, Loader2, Minus, Plus, TicketPercent } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/schema";
import { formatNumber } from "@/lib/format";

const MAX_MONTHS = 12;

type Format = "ONLINE" | "OFFLINE";
type Discount = components["schemas"]["Discount"];

export type BuyPanelProps = {
  slug: string;
  studyFormat: "ONLINE" | "OFFLINE" | "BOTH";
  priceOnline: number;
  priceOfflineMonthly: number;
};

/**
 * Sotib olish: shakl va (offlayn uchun) oylar soni tanlanadi.
 *
 * Bu yerda ko'rsatilgan summa faqat ma'lumot uchun — buyurtma yaratilganda backend uni
 * qaytadan hisoblaydi va o'zining qiymatini ishlatadi.
 */
export function BuyPanel({ slug, studyFormat, priceOnline, priceOfflineMonthly }: BuyPanelProps) {
  const t = useTranslations("Course");
  const locale = useLocale();
  const router = useRouter();
  const both = studyFormat === "BOTH";
  const [format, setFormat] = useState<Format>(studyFormat === "OFFLINE" ? "OFFLINE" : "ONLINE");
  const [months, setMonths] = useState(1);
  const [busy, setBusy] = useState(false);

  const [discount, setDiscount] = useState<Discount | null>(null);

  // Do'stning birinchi to'loviga chegirma yoki kupon (backend buyurtmada ham shuni qo'llaydi).
  useEffect(() => {
    let cancelled = false;
    api
      .GET("/api/v1/rewards/discount/")
      .then(({ data }) => {
        if (!cancelled && data?.discount) setDiscount(data.discount);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const offline = format === "OFFLINE";
  const total = offline ? priceOfflineMonthly * months : priceOnline;
  const final = discount ? total - Math.floor((total * discount.percent) / 100) : total;

  async function buy() {
    setBusy(true);
    const { data, error, response } = await api.POST("/api/v1/orders/", {
      body: { course: slug, study_format: format, months: offline ? months : 1 },
    });
    if (response.status === 403) {
      router.push(`/auth/login?next=${encodeURIComponent(`/courses/${slug}`)}`);
      return;
    }
    if (error || !data) {
      setBusy(false);
      toast.error(readApiError(error)?.message || t("buyFailed"));
      return;
    }
    // Click sahifasi — tashqi manzil, shuning uchun to'g'ridan-to'g'ri o'tiladi.
    window.location.assign(data.pay_url);
  }

  return (
    <div>
      {both && (
        <fieldset className="buy-formats">
          <legend className="sr-only">{t("chooseFormat")}</legend>
          {(["ONLINE", "OFFLINE"] as const).map((value) => (
            <label key={value} className="buy-format">
              <input
                type="radio"
                name="study-format"
                value={value}
                checked={format === value}
                onChange={() => setFormat(value)}
              />
              <span>
                <strong>{t(value === "ONLINE" ? "online" : "offline")}</strong>
                <em>{t(value === "ONLINE" ? "onlineNote" : "offlineNote")}</em>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {offline && (
        <div className="buy-months">
          <span id="months-label">{t("months")}</span>
          <div className="buy-months__control">
            <button
              type="button"
              onClick={() => setMonths((value) => Math.max(1, value - 1))}
              disabled={months <= 1}
              aria-label={t("monthsLess")}
            >
              <Minus aria-hidden className="size-4" />
            </button>
            <output aria-labelledby="months-label">{months}</output>
            <button
              type="button"
              onClick={() => setMonths((value) => Math.min(MAX_MONTHS, value + 1))}
              disabled={months >= MAX_MONTHS}
              aria-label={t("monthsMore")}
            >
              <Plus aria-hidden className="size-4" />
            </button>
          </div>
        </div>
      )}

      {discount && (
        <p className="buy-discount">
          <TicketPercent aria-hidden className="size-4 shrink-0" />
          {t(discount.reason === "REFERRAL" ? "discountReferral" : "discountCoupon", {
            percent: discount.percent,
          })}
        </p>
      )}

      <p className="buy-total">
        <span>{t("total")}</span>
        <strong>
          {discount && (
            <s className="buy-total__old">{t("price", { price: formatNumber(total, locale) })}</s>
          )}
          {t("price", { price: formatNumber(final, locale) })}
        </strong>
      </p>

      <Button
        type="button"
        data-magnetic
        disabled={busy}
        onClick={() => void buy()}
        className="mt-4 h-13 w-full gap-2 rounded-full text-base shadow-[0_12px_32px_-14px_var(--caret)]"
      >
        {t("buy")}
        {busy ? (
          <Loader2 aria-hidden className="size-5 animate-spin" />
        ) : (
          <ArrowRight aria-hidden className="size-5" />
        )}
      </Button>
    </div>
  );
}
