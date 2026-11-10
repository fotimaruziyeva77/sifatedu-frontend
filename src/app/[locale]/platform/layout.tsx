import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ClientMessages } from "@/i18n/client-messages";
import { getCenter, unavailable } from "@/lib/api/center";

import "./platform.css";

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const [t, center] = await Promise.all([
    getTranslations({ locale, namespace: "Platform" }),
    getCenter(),
  ]);
  // Sayt yopiq yoki backend javob bermayapti: nom tashqariga chiqmaydi (asosiy layout sarlavhasi).
  if (unavailable(center)) return {};
  const title = t("metaTitle", { name: center.name });

  return {
    title: { absolute: title },
    description: t("metaDescription"),
    icons: { icon: "data:," },
    openGraph: { title, description: t("metaDescription"), siteName: center.name },
  };
}

/** Platforma sayti: markaz egalari uchun. Sayt manzilida ko'rinmaydi (`src/proxy.ts`). */
export default async function PlatformLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ClientMessages group="platform">
      <div className="pf">{children}</div>
    </ClientMessages>
  );
}
