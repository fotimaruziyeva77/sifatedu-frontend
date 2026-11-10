import { getTranslations } from "next-intl/server";

/** Markaz to'xtatilgan: to'lov muddati o'tgan yoki platforma to'xtatgan. Ma'lumot o'chmaydi. */
export async function CenterBlocked({ phone, telegram }: { phone: string; telegram: string }) {
  const t = await getTranslations("Center");

  return (
    <main className="grid min-h-svh place-items-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold text-balance">{t("blockedTitle")}</h1>
        <p className="mt-3 text-pretty text-muted-foreground">{t("blockedText")}</p>
        {(phone || telegram) && (
          <p className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
            <span className="text-muted-foreground">{t("support")}</span>
            {phone && (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="font-mono underline">
                {phone}
              </a>
            )}
            {telegram && (
              <a
                href={`https://t.me/${telegram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Telegram
              </a>
            )}
          </p>
        )}
      </div>
    </main>
  );
}
