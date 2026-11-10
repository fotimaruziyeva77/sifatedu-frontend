import { describe, expect, it } from "vitest";

import { SLUG_PATTERN, suggestSlug } from "./slug";

describe("suggestSlug", () => {
  it.each([
    ["Najot Ta'lim", "najot-talim"],
    ["O‘quv Markazi №1", "oquv-markazi-1"],
    ["Билим Маркази", "bilim-markazi"],
    ["  123 Star  ", "star"],
    ["---", ""],
  ])("%s → %s", (name, slug) => {
    expect(suggestSlug(name)).toBe(slug);
  });

  it("uzun nomni qisqartiradi va qoidaga mos qoladi", () => {
    const slug = suggestSlug("Xalqaro Innovatsion Ta'lim Va Tarbiya Markazi Toshkent");
    expect(slug.length).toBeLessThanOrEqual(30);
    expect(slug).toMatch(SLUG_PATTERN);
  });
});

describe("SLUG_PATTERN", () => {
  it.each(["abc", "najot-talim", "a1b"])("%s — to'g'ri", (slug) => {
    expect(slug).toMatch(SLUG_PATTERN);
  });

  it.each(["ab", "1abc", "abc-", "-abc", "a--b", "ABC", "a_b", "abc.def"])("%s — xato", (slug) => {
    expect(slug).not.toMatch(SLUG_PATTERN);
  });
});
