"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Category } from "@/lib/api/catalog";
import { cn } from "@/lib/utils";

import { LEVELS, SORTS } from "./options";

const SEARCH_DELAY_MS = 400;

/**
 * Katalog filtrlari. Holat URL'da saqlanadi: havolani ulashish mumkin, orqaga tugmasi
 * ishlaydi va sahifa serverda qayta chiziladi (kartalar server komponenti bo'lib qoladi).
 */
export function CatalogFilters({ categories }: { categories: Category[] }) {
  const t = useTranslations("Catalog");
  const tLevel = useTranslations("Level");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const typed = useRef(false);

  const category = params.get("category") ?? "";
  const level = params.get("level") ?? "";
  const sort = params.get("sort") ?? "popular";
  const hasFilters = Boolean(category || level || params.get("q"));

  function apply(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    // Filtr o'zgarganda birinchi sahifadan boshlanadi.
    next.delete("page");
    const search = next.toString();
    startTransition(() => router.replace(search ? `${pathname}?${search}` : pathname));
  }

  // Yozish tugagach qidiriladi: har harfda so'rov yuborilmaydi.
  useEffect(() => {
    if (!typed.current) return;
    const timer = globalThis.setTimeout(() => apply({ q: query.trim() || null }), SEARCH_DELAY_MS);
    return () => globalThis.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- faqat yozilgan matnga qarab
  }, [query]);

  return (
    <div className="catalog-filters">
      <div className="catalog-search">
        <Search aria-hidden className="catalog-search__icon" />
        <Input
          type="search"
          value={query}
          onChange={(event) => {
            typed.current = true;
            setQuery(event.target.value);
          }}
          placeholder={t("searchPlaceholder")}
          aria-label={t("search")}
          className="h-12 pl-11 text-base md:text-base"
        />
        {pending && <span aria-hidden className="catalog-search__pending" />}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="h-11 gap-2 rounded-full px-4 lg:hidden"
        >
          <SlidersHorizontal aria-hidden className="size-4" />
          {t("filters")}
        </Button>

        <label className="catalog-sort">
          <span className="sr-only">{t("sort")}</span>
          <select
            value={sort}
            onChange={(event) => apply({ sort: event.target.value })}
            className="catalog-sort__select"
          >
            {SORTS.map((option) => (
              <option key={option} value={option}>
                {t(`sorts.${option}`)}
              </option>
            ))}
          </select>
        </label>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              typed.current = false;
              apply({ q: null, category: null, level: null });
            }}
            className="catalog-reset"
          >
            <X aria-hidden className="size-3.5" />
            {t("reset")}
          </button>
        )}
      </div>

      <div className={cn("catalog-groups", open && "is-open")}>
        <FilterGroup label={t("category")}>
          <FilterChip active={!category} onClick={() => apply({ category: null })}>
            {t("all")}
          </FilterChip>
          {categories.map((item) => (
            <FilterChip
              key={item.slug}
              active={category === item.slug}
              onClick={() => apply({ category: item.slug })}
            >
              {item.name}
              <span className="catalog-chip__count">{item.course_count}</span>
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup label={t("level")}>
          <FilterChip active={!level} onClick={() => apply({ level: null })}>
            {t("all")}
          </FilterChip>
          {LEVELS.map((option) => (
            <FilterChip
              key={option}
              active={level === option}
              onClick={() => apply({ level: option })}
            >
              {tLevel(option)}
            </FilterChip>
          ))}
        </FilterGroup>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="catalog-group">
      <span className="catalog-group__label">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn("catalog-chip", active && "is-active")}
    >
      {children}
    </button>
  );
}
