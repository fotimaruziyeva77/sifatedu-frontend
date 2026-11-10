import type { MetadataRoute } from "next";

import { languageAlternates } from "@/i18n/alternates";
import { routing } from "@/i18n/routing";
import { getAllCourseSlugs } from "@/lib/api/catalog";
import { getCenter, unavailable } from "@/lib/api/center";
import { siteOrigin } from "@/lib/site-origin";

// Har markazning kurslari boshqa: build paytida bir marta yig'ib bo'lmaydi.
export const dynamic = "force-dynamic";

const CENTER_PATHS = ["", "/courses", "/offer", "/privacy", "/refund-policy"];
const PLATFORM_PATHS = ["", "/signup"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [center, origin] = await Promise.all([getCenter(), siteOrigin()]);
  if (unavailable(center)) return [];
  const paths =
    center.kind === "platform"
      ? PLATFORM_PATHS
      : [...CENTER_PATHS, ...(await getAllCourseSlugs()).map((slug) => `/courses/${slug}`)];

  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${origin}/${locale}${path}`,
      changeFrequency: sitemapFrequency(path),
      priority: sitemapPriority(path),
      alternates: { languages: languageAlternates(path, origin) },
    })),
  );
}

/** Landing tez-tez, kurslar haftasiga, huquqiy sahifalar kamdan-kam o'zgaradi. */
function sitemapFrequency(path: string): "weekly" | "yearly" {
  return path.startsWith("/courses") || path === "" ? "weekly" : "yearly";
}

function sitemapPriority(path: string): number {
  if (path === "") return 1;
  if (path === "/courses" || path === "/signup") return 0.9;
  if (path.startsWith("/courses/")) return 0.8;
  return 0.3;
}
