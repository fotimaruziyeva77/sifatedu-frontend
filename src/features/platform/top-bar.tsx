import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Link } from "@/i18n/navigation";

export async function TopBar({ name, sections = true }: { name: string; sections?: boolean }) {
  const t = await getTranslations("Platform");

  return (
    <header className="pf-top">
      <Link href="/" className="pf-name">
        {name}
      </Link>
      {sections && (
        <nav className="pf-nav" aria-label={t("navFeatures")}>
          <a href="#features">{t("navFeatures")}</a>
          <a href="#plans">{t("navPlans")}</a>
        </nav>
      )}
      <div className="pf-tools">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>
    </header>
  );
}
