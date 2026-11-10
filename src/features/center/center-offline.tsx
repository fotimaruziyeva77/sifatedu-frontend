import { getTranslations } from "next-intl/server";

/** Backend javob bermayapti: markaz brendi noma'lum, shuning uchun sahifa neytral. */
export async function CenterOffline() {
  const t = await getTranslations("Center");

  return (
    <main className="grid min-h-svh place-items-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold text-balance">{t("offlineTitle")}</h1>
        <p className="mt-3 text-pretty text-muted-foreground">{t("offlineText")}</p>
      </div>
    </main>
  );
}
