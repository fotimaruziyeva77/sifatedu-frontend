import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * Sahifa yuklanayotganda: brendning "nuqtalarni bog'lang" g'oyasi — uchta nuqta chiziqlar
 * bilan navbatma-navbat ulanadi. Ekran o'quvchi uchun "Yuklanmoqda…" deb e'lon qilinadi.
 */
export function PageLoader({ className }: { className?: string }) {
  const t = useTranslations("Nav");

  return (
    <div role="status" aria-live="polite" className={cn("page-loader", className)}>
      <svg viewBox="0 0 120 104" aria-hidden className="page-loader__mark">
        <path className="page-loader__line" pathLength={1} d="M20 84 L60 20" />
        <path className="page-loader__line" pathLength={1} d="M60 20 L100 84" />
        <path className="page-loader__line" pathLength={1} d="M100 84 L20 84" />
        <circle className="page-loader__dot" cx="20" cy="84" r="9" />
        <circle className="page-loader__dot" cx="60" cy="20" r="9" />
        <circle className="page-loader__dot page-loader__dot--hot" cx="100" cy="84" r="9" />
      </svg>
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}
