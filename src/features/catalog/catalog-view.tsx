import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { delay } from "@/features/landing/section";
import { type CatalogQuery, getCategories, getCourses, PAGE_SIZE } from "@/lib/api/catalog";

import { CourseCard } from "./course-card";
import { CatalogFilters } from "./filters";
import { CatalogPagination } from "./pagination";

/** `?q=a&q=b` bo'lsa ham bitta qiymat olinadi. */
export function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function catalogQuery(search: Record<string, string | string[] | undefined>): CatalogQuery {
  return {
    q: single(search.q),
    category: single(search.category),
    level: single(search.level),
    sort: single(search.sort),
    page: single(search.page),
  };
}

/**
 * Filtrlar, kurslar va sahifalash. Ochiq saytda ham (`/courses`), kabinetda ham
 * (`/dashboard/catalog`) ishlatiladi — faqat havolalar boshqa joyga olib boradi.
 */
export async function CatalogView({
  locale,
  query,
  base,
}: {
  locale: string;
  query: CatalogQuery;
  /** Kurs sahifalari va sahifalash shu yo'ldan boshlanadi. */
  base: "/courses" | "/dashboard/catalog";
}) {
  const [t, categories, courses] = await Promise.all([
    getTranslations("Catalog"),
    getCategories(locale),
    getCourses(locale, query),
  ]);

  const page = Math.max(1, Number(query.page) || 1);
  const pageCount = Math.ceil(courses.count / PAGE_SIZE);

  return (
    <>
      <CatalogFilters categories={categories} />

      <p aria-live="polite" className="mt-8 text-sm text-muted-foreground">
        {t("found", { count: courses.count })}
      </p>

      {courses.results.length > 0 ? (
        <ul className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.results.map((course, index) => (
            <li key={course.slug} data-reveal style={delay((index % 3) * 80)}>
              <CourseCard
                course={course}
                trackLabel={course.category.name}
                href={`${base}/${course.slug}`}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="catalog-empty mt-5">
          <SearchX aria-hidden className="size-8 text-muted-foreground" />
          <p className="max-w-md text-pretty">{t("empty")}</p>
        </div>
      )}

      <CatalogPagination query={query} page={page} pageCount={pageCount} base={base} />
    </>
  );
}
