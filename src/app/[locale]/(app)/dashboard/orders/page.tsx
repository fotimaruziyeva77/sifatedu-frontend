import { ArrowRight, CreditCard, ReceiptText } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getMyOrders } from "@/lib/api/payments";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/orders">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Orders" });
  return { title: t("title"), robots: { index: false } };
}

export default async function OrdersPage({ params }: PageProps<"/[locale]/dashboard/orders">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tCourse, orders] = await Promise.all([
    getTranslations("Orders"),
    getTranslations("Course"),
    getMyOrders(locale),
  ]);
  const intl = await getLocale();

  return (
    <>
      <header>
        <h1 className="app-title">{t("title")}</h1>
      </header>

      {orders.length > 0 ? (
        <ul className="order-list mt-8">
          {orders.map((order) => (
            <li key={order.id} className="order-row">
              <div className="min-w-0">
                <p className="font-medium text-pretty">{order.course_title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(order.study_format as "ONLINE" | "OFFLINE")}
                  {order.study_format === "OFFLINE" &&
                    ` · ${t("monthsCount", { count: order.months })}`}
                  {" · "}
                  {new Date(order.created_at).toLocaleDateString(intl)}
                </p>
              </div>

              <p className="order-row__amount font-mono">
                {tCourse("price", { price: formatNumber(order.amount, locale) })}
              </p>

              <span className="order-row__status" data-status={order.status}>
                {t(order.status as "NEW" | "PAID" | "EXPIRED" | "CANCELLED" | "REFUNDED")}
              </span>

              <div className="order-row__links">
                {order.receipt_url && (
                  <a href={order.receipt_url} target="_blank" rel="noreferrer">
                    <ReceiptText aria-hidden className="size-4" />
                    {t("receipt")}
                  </a>
                )}
                {order.status === "PAID" && (
                  <Link href={`/dashboard/courses/${order.course_slug}`}>
                    {t("open")}
                    <ArrowRight aria-hidden className="size-4" />
                  </Link>
                )}
                {order.status === "NEW" && (
                  <Link href={`/dashboard/catalog/${order.course_slug}`}>
                    {t("pay")}
                    <ArrowRight aria-hidden className="size-4" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="app-empty mt-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-caret">
            <CreditCard aria-hidden className="size-6" />
          </span>
          <p className="text-muted-foreground">{t("empty")}</p>
          <Button asChild className="h-11 gap-2 rounded-full px-5">
            <Link href="/dashboard/catalog">
              {t("browse")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
