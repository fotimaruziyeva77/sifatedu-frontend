import { getTranslations } from "next-intl/server";

/** Klaviatura uchun: birinchi Tab bosilganda "Asosiy kontentga o'tish" havolasi chiqadi. */
export async function SkipLink() {
  const t = await getTranslations("Nav");
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
    >
      {t("skip")}
    </a>
  );
}
