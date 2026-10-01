import { ArrowRight, Coins, Gift, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BuyGift } from "@/features/shop/buy-gift";
import { Link } from "@/i18n/navigation";
import { getShop } from "@/lib/api/shop";
import { formatNumber } from "@/lib/format";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/shop">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Shop" });
  return { title: t("title"), robots: { index: false } };
}

/**
 * Do'kon: coin evaziga sovg'alar. Coin o'qish uchun topiladi (Yutuqlar); olinganda yechiladi,
 * sovg'a "Buyurtmalarim"da kuzatiladi. Zaxirasi tugagan sovg'a ko'rinmaydi.
 */
export default async function ShopPage({ params }: PageProps<"/[locale]/dashboard/shop">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, shop] = await Promise.all([getTranslations("Shop"), getShop(locale)]);
  if (!shop) notFound();

  return (
    <>
      <header className="shop-head">
        <div>
          <h1 className="app-title">{t("title")}</h1>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{t("intro")}</p>
        </div>
        <div className="shop-balance">
          <Coins aria-hidden className="size-5" />
          <p>
            <strong>{formatNumber(shop.coins, locale)}</strong> {t("coins")}
          </p>
          <Link href="/dashboard/shop/orders" className="shop-balance__link">
            {t("myOrders")}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </header>

      {shop.products.length === 0 ? (
        <div className="app-empty mt-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-caret">
            <Gift aria-hidden className="size-6" />
          </span>
          <p className="max-w-lg text-pretty text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <ul className="shop-grid mt-8">
          {shop.products.map((product) => (
            <li key={product.id}>
              <article className="shop-card" aria-labelledby={`gift-${product.id}`}>
                <div className="shop-card__image">
                  {product.image ? (
                    // Ommaviy storage rasmi: next/image optimizatsiyasi shart emas.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt="" loading="lazy" />
                  ) : product.kind === "DIGITAL" ? (
                    <Sparkles aria-hidden className="size-10" />
                  ) : (
                    <Gift aria-hidden className="size-10" />
                  )}
                </div>
                <div className="shop-card__body">
                  <h2 id={`gift-${product.id}`} className="shop-card__name">
                    {product.name}
                  </h2>
                  {product.description && <p className="shop-card__text">{product.description}</p>}
                  <p className="shop-card__meta">
                    <span className="shop-card__price">
                      <Coins aria-hidden className="size-4" />
                      {t("price", { price: formatNumber(product.price, locale) })}
                    </span>
                    {product.stock !== null && <span>{t("stock", { count: product.stock })}</span>}
                    <span>{t(`kind.${product.kind}`)}</span>
                  </p>
                </div>
                <div className="shop-card__action">
                  <BuyGift
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    missing={Math.max(0, product.price - shop.coins)}
                  />
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-sm text-muted-foreground">
        {t.rich("earnHint", {
          link: (chunks) => (
            <Link href="/dashboard/rewards" className="note__link">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </>
  );
}
