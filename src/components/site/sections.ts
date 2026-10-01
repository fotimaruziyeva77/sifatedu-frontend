/** Landing bo'limlarining id'lari: menyu, anchor havolalar va faol bo'lim belgisi uchun. */
export const NAV_SECTIONS = ["about", "path", "faq"] as const;
export const CONTACT_SECTION = "contact";
export const QUIZ_SECTION = "quiz";

export type NavSection = (typeof NAV_SECTIONS)[number];
