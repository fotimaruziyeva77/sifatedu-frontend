import { formatNumber } from "@/lib/format";

/** Narx ko'rsatish uchun kerakli maydonlar (kartochka ham, kurs sahifasi ham beradi). */
export type Priced = {
  is_free: boolean;
  study_format: "ONLINE" | "OFFLINE" | "BOTH";
  price_online: number;
  price_offline_monthly: number;
};

export type PriceLabels = {
  free: string;
  price: (value: string) => string;
  once: string;
  monthly: string;
};

export type PriceLine = { amount: string; unit: string };

/**
 * Bir kursning ikki narxi bo'lishi mumkin: onlayn — bir martalik to'lov, offlayn — oylik.
 * Shuning uchun narx har doim birlik bilan ko'rsatiladi, aks holda taqqoslash chalg'itadi.
 */
export function priceLines(course: Priced, locale: string, labels: PriceLabels): PriceLine[] {
  if (course.is_free) return [{ amount: labels.free, unit: "" }];

  const lines: PriceLine[] = [];
  if (course.study_format !== "OFFLINE" && course.price_online > 0) {
    lines.push({
      amount: labels.price(formatNumber(course.price_online, locale)),
      unit: labels.once,
    });
  }
  if (course.study_format !== "ONLINE" && course.price_offline_monthly > 0) {
    lines.push({
      amount: labels.price(formatNumber(course.price_offline_monthly, locale)),
      unit: labels.monthly,
    });
  }
  // Narx kiritilmagan bo'lsa, "bepul" deb yozib qo'yish xato bo'ladi.
  return lines.length > 0 ? lines : [{ amount: "—", unit: "" }];
}

/** Eng arzon variant: kartochkada bitta qator ko'rsatiladi. */
export function primaryPrice(course: Priced, locale: string, labels: PriceLabels): PriceLine {
  return priceLines(course, locale, labels)[0];
}
