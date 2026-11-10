import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCenter } from "@/lib/api/center";
import { getCenterSetup } from "@/lib/api/center-setup";

import { setupItems } from "./checklist";

/** Bosh sahifada adminga: markaz sozlanib bo'lmaguncha ko'rinadi. */
export async function SetupReminder({ locale }: { locale: string }) {
  const center = await getCenter();
  if (center.flagship) return null;
  const [t, setup] = await Promise.all([getTranslations("CenterSettings"), getCenterSetup(locale)]);
  if (!setup) return null;
  const items = setupItems(setup, t);
  const done = items.filter((item) => item.done).length;
  if (done === items.length) return null;

  return (
    <section aria-labelledby="setup-reminder" className="app-card mt-8">
      <h2 id="setup-reminder" className="app-section-title">
        {t("reminderTitle")}
      </h2>
      <p className="mt-2 text-pretty text-muted-foreground">
        {t("reminderText", { done, total: items.length })}
      </p>
      <Button asChild className="mt-4 h-11 gap-2 rounded-full px-5">
        <Link href="/dashboard/center">
          {t("reminderAction")}
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </section>
  );
}
