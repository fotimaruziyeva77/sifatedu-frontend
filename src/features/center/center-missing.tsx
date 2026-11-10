import { getTranslations } from "next-intl/server";

/** Bu manzilda markaz yo'q: subdomen xato yozilgan yoki markaz hali ochilmagan. */
export async function CenterMissing() {
  const t = await getTranslations("Center");

  return (
    <main className="grid min-h-svh place-items-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold text-balance">{t("missingTitle")}</h1>
        <p className="mt-3 text-pretty text-muted-foreground">{t("missingText")}</p>
      </div>
    </main>
  );
}
