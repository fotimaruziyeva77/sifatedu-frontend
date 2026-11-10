import type { SitePayload } from "@/lib/api/site";

/** Landing bo'limlarining id'lari: menyu, anchor havolalar va faol bo'lim belgisi uchun. */
export const NAV_SECTIONS = ["about", "path", "faq"] as const;
export const CONTACT_SECTION = "contact";
export const QUIZ_SECTION = "quiz";

export type NavSection = (typeof NAV_SECTIONS)[number];

/** Menyuda faqat sahifada bor bo'limlar: yangi markazda matnlar hali to'ldirilmagan bo'ladi. */
export function visibleSections(site: SitePayload | null, flagship: boolean): NavSection[] {
  if (flagship) return [...NAV_SECTIONS];
  if (!site) return [];
  const { settings, instructors, steps, faq } = site;
  const has: Record<NavSection, boolean> = {
    about: Boolean(settings.about_text || settings.promo_video || instructors.length),
    path: steps.length > 0,
    faq: faq.length > 0,
  };
  return NAV_SECTIONS.filter((id) => has[id]);
}
