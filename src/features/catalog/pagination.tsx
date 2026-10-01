import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { CatalogQuery } from "@/lib/api/catalog";
import { cn } from "@/lib/utils";

/** Joriy filtrlarni saqlab, berilgan sahifaga havola. */
function pageHref(base: string, query: CatalogQuery, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value && key !== "page") params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `${base}?${search}` : base;
}

export async function CatalogPagination({
  query,
  page,
  pageCount,
  base = "/courses",
}: {
  query: CatalogQuery;
  page: number;
  pageCount: number;
  base?: string;
}) {
  const t = await getTranslations("Catalog");
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <nav aria-label={t("pagination")} className="catalog-pagination">
      <Link
        href={pageHref(base, query, page - 1)}
        aria-label={t("previous")}
        aria-disabled={page === 1}
        tabIndex={page === 1 ? -1 : undefined}
        className={cn("catalog-page", page === 1 && "is-disabled")}
      >
        <ChevronLeft aria-hidden className="size-4" />
      </Link>

      {pages.map((number) => (
        <Link
          key={number}
          href={pageHref(base, query, number)}
          aria-current={number === page ? "page" : undefined}
          className={cn("catalog-page", number === page && "is-active")}
        >
          {number}
        </Link>
      ))}

      <Link
        href={pageHref(base, query, page + 1)}
        aria-label={t("next")}
        aria-disabled={page === pageCount}
        tabIndex={page === pageCount ? -1 : undefined}
        className={cn("catalog-page", page === pageCount && "is-disabled")}
      >
        <ChevronRight aria-hidden className="size-4" />
      </Link>
    </nav>
  );
}
