import { ArrowLeft, Compass } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/** Kabinet ichida topilmagan sahifa (kurs, dars): chap menyu joyida qoladi. */
export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <section className="flex min-h-[60svh] flex-col items-center justify-center gap-5 text-center">
      <p aria-hidden className="font-display text-7xl font-bold tracking-tight text-caret">
        404
      </p>
      <h1 className="app-title">{t("title")}</h1>
      <p className="max-w-md text-pretty text-muted-foreground">{t("dashboardText")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild className="h-11 gap-2 rounded-full px-5">
          <Link href="/dashboard/catalog">
            <Compass aria-hidden />
            {t("catalog")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-11 gap-2 rounded-full px-5">
          <Link href="/dashboard">
            <ArrowLeft aria-hidden />
            {t("backDashboard")}
          </Link>
        </Button>
      </div>
    </section>
  );
}
