"use client";

import { CONTACT_SECTION } from "@/components/site/sections";

const EVENT = "sifat:select-course";

/** Kurs kartochkasidan ariza formasiga: kursni tanlab, formaga o'tadi. */
export function selectCourseForLead(slug: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: slug }));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document
    .getElementById(CONTACT_SECTION)
    ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

export function onCourseSelected(handler: (slug: string) => void): () => void {
  const listener = (event: Event) => handler((event as CustomEvent<string>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
