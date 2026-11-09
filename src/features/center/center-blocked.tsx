import { getTranslations } from "next-intl/server";

/** Markaz to'xtatilgan: to'lov muddati o'tgan yoki platforma to'xtatgan. Ma'lumot o'chmaydi. */
export async function CenterBlocked() {
  const t = await getTranslations("Center");

  return (
    <main className="grid min-h-svh place-items-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold text-balance">{t("blockedTitle")}</h1>
        <p className="mt-3 text-pretty text-muted-foreground">{t("blockedText")}</p>
      </div>
    </main>
  );
}
