import { ArrowLeft, Coins, ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getMyPurchases } from "@/lib/api/shop";
import { formatNumber, stamp } from "@/lib/format";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/shop/orders">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Shop" });
  return { title: t("ordersTitle"), robots: { index: false } };
}

/** Buyurtmalarim: holati (yangi → tayyor → topshirildi yoki bekor), narxi va menejer izohi. */
export default async function ShopOrdersPage({
  params,
}: PageProps<"/[locale]/dashboard/shop/orders">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, purchases] = await Promise.all([getTranslations("Shop"), getMyPurchases(locale)]);

  return (
    <>
      <Link
        href="/dashboard/shop"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {t("title")}
      </Link>
      <header className="mt-4">
        <h1 className="app-title">{t("ordersTitle")}</h1>
        <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{t("ordersIntro")}</p>
      </header>

      {purchases.length === 0 ? (
        <div className="app-empty mt-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-caret">
            <ShoppingBag aria-hidden className="size-6" />
          </span>
          <p className="max-w-lg text-pretty text-muted-foreground">{t("ordersEmpty")}</p>
        </div>
      ) : (
        <ul className="shop-orders mt-8">
          {purchases.map((purchase) => (
            <li key={purchase.id} className="shop-order">
              <div className="min-w-0">
                <p className="shop-order__name">{purchase.name}</p>
                <p className="shop-order__meta">
                  {stamp(purchase.created_at)} ·{" "}
                  <span className="inline-flex items-center gap-1">
                    <Coins aria-hidden className="size-3.5" />
                    {t("price", { price: formatNumber(purchase.price, locale) })}
                  </span>
                </p>
                {purchase.note && <p className="shop-order__note">{purchase.note}</p>}
              </div>
              <span className="shop-status" data-status={purchase.status}>
                {t(`status.${purchase.status}`)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
