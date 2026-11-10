import type { MetadataRoute } from "next";

import { siteOrigin } from "@/lib/site-origin";

// Har markazning o'z manzili: build paytida bir marta yozib bo'lmaydi.
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] },
    sitemap: `${await siteOrigin()}/sitemap.xml`,
  };
}
