import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <section className="flex min-h-[70svh] flex-col items-center justify-center gap-6 px-4 pt-24 text-center">
      <p aria-hidden className="font-display text-8xl font-bold tracking-tight text-caret">
        404
      </p>
      <h1 className="font-display text-2xl font-bold tracking-tight">{t("title")}</h1>
      <Button asChild variant="outline" className="h-11 gap-2 rounded-full px-5">
        <Link href="/">
          <ArrowLeft aria-hidden />
          {t("back")}
        </Link>
      </Button>
    </section>
  );
}
