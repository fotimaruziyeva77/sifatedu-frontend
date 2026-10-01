import type { MetadataRoute } from "next";

import { languageAlternates } from "@/i18n/alternates";
import { routing } from "@/i18n/routing";
import { getAllCourseSlugs } from "@/lib/api/catalog";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost";
const STATIC_PATHS = ["", "/courses", "/offer", "/privacy", "/refund-policy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllCourseSlugs();
  const paths = [...STATIC_PATHS, ...slugs.map((slug) => `/courses/${slug}`)];

  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${APP_URL}/${locale}${path}`,
      changeFrequency: sitemapFrequency(path),
      priority: sitemapPriority(path),
      alternates: { languages: languageAlternates(path, APP_URL) },
    })),
  );
}

/** Landing tez-tez, kurslar haftasiga, huquqiy sahifalar kamdan-kam o'zgaradi. */
function sitemapFrequency(path: string): "weekly" | "yearly" {
  return path.startsWith("/courses") || path === "" ? "weekly" : "yearly";
}

function sitemapPriority(path: string): number {
  if (path === "") return 1;
  if (path === "/courses") return 0.9;
  if (path.startsWith("/courses/")) return 0.8;
  return 0.3;
}
