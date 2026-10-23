import { setRequestLocale } from "next-intl/server";

import { ClientMessages } from "@/i18n/client-messages";

import "@/features/lesson/slides/slides.css";

/** Chop etish sahifalari: kabinet menyusisiz, faqat mazmun. */
export default async function PrintLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ClientMessages group="app">{children}</ClientMessages>;
}
