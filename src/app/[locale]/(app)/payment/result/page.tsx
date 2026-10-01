import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PaymentResult } from "@/features/payments/payment-result";

import "../../../(site)/courses/catalog.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/payment/result">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Payment" });
  return { title: t("title"), robots: { index: false } };
}

export default async function PaymentResultPage({
  params,
  searchParams,
}: PageProps<"/[locale]/payment/result">) {
  const [{ locale }, search] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations("Payment");

  const raw = Array.isArray(search.order) ? search.order[0] : search.order;
  const orderId = Number(raw);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return <p className="payment-state">{t("notFound")}</p>;
  }
  return <PaymentResult orderId={orderId} />;
}
