import "server-only";

import { headers } from "next/headers";

const FALLBACK = "http://localhost";

/** Saytning hozirgi manzili: har markazning o'z domeni (SEO, sitemap, ulashish havolalari). */
export async function siteOrigin(): Promise<string> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host");
  const protocol = incoming.get("x-forwarded-proto") ?? "http";
  const origin = `${protocol}://${host}`;
  return URL.canParse(origin) ? origin : FALLBACK;
}
