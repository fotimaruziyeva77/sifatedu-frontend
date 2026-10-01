import { describe, expect, it } from "vitest";

import { parseInline, parseRichText } from "./rich-text";

describe("parseInline", () => {
  it("qalin matn va havolani ajratadi", () => {
    expect(parseInline("**Frontend** kursi: https://sifat.uz/uz/courses.")).toEqual([
      { type: "bold", value: "Frontend" },
      { type: "text", value: " kursi: " },
      { type: "link", href: "https://sifat.uz/uz/courses" },
      { type: "text", value: "." },
    ]);
  });

  it("HTML'ni oddiy matn sifatida qoldiradi", () => {
    expect(parseInline('<img src=x onerror="alert(1)">')).toEqual([
      { type: "text", value: '<img src=x onerror="alert(1)">' },
    ]);
  });

  it("faqat https havola bo'ladi", () => {
    expect(parseInline("javascript:alert(1) http://x.uz")).toEqual([
      { type: "text", value: "javascript:alert(1) http://x.uz" },
    ]);
  });
});

describe("parseRichText", () => {
  it("paragraf va ro'yxatni ajratadi", () => {
    const blocks = parseRichText("Bizda ikki shakl:\n- onlayn\n- offlayn\n\nQaysi biri qulay?");

    expect(blocks.map((block) => block.type)).toEqual(["paragraph", "list", "paragraph"]);
    expect(blocks[1]).toEqual({
      type: "list",
      items: [[{ type: "text", value: "onlayn" }], [{ type: "text", value: "offlayn" }]],
    });
  });

  it("raqamli ro'yxat ham ro'yxat", () => {
    expect(parseRichText("1. HTML\n2) CSS")[0].type).toBe("list");
  });
});
