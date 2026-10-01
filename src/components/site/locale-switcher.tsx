"use client";

import { CheckIcon, GlobeIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale, routing } from "@/i18n/routing";

const LABELS: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
};

export function LocaleSwitcher() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    startTransition(() => {
      // Hash saqlanadi: foydalanuvchi o'sha bo'limda qoladi.
      router.replace(`${pathname}${window.location.hash}`, { locale: next, scroll: false });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("language")}
          disabled={isPending}
          className="gap-1.5 font-mono text-xs tracking-wider uppercase"
        >
          <GlobeIcon aria-hidden />
          {locale}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {routing.locales.map((code) => (
          <DropdownMenuItem
            key={code}
            lang={code}
            onSelect={() => switchTo(code)}
            className="justify-between"
          >
            {LABELS[code]}
            {code === locale && <CheckIcon aria-hidden className="text-caret" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
