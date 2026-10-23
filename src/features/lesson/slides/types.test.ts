import { describe, expect, it } from "vitest";

import {
  type Block,
  type Card,
  type CodeBlock,
  cardColumns,
  columnWeight,
  isOutput,
  slideKind,
  slideList,
} from "./types";

const heading = (level: number, text: string): Block => ({
  t: "h",
  level,
  inl: [["t", text]],
});
const paragraph = (text: string): Block => ({ t: "p", inl: [["t", text]] });
const code = (lang: string): CodeBlock => ({ t: "code", lang, lines: [[["", "x = 1"]]] });
const card = (...blocks: Block[]): Card => ({
  title: [["t", "Karta"]],
  label: false,
  tone: "",
  num: "",
  blocks,
});

describe("slideList", () => {
  it("API javobidagi slaydlarni qaytaradi", () => {
    const slides = [{ blocks: [paragraph("bir")] }];
    expect(slideList({ count: 1, slides, teacher_notes: "" })).toEqual(slides);
  });

  it("slayd bo'lmasa — bo'sh ro'yxat", () => {
    expect(slideList(null)).toEqual([]);
    expect(slideList({ count: 0, slides: "xato", teacher_notes: "" })).toEqual([]);
  });
});

describe("slideKind", () => {
  it("backend bergan turi", () => {
    expect(slideKind({ kind: "practice", blocks: [] }, 4)).toBe("practice");
  });

  it("eski tuzilma: # sarlavha — muqova yoki bo'lim", () => {
    expect(slideKind({ blocks: [heading(1, "for sikli")] }, 0)).toBe("cover");
    expect(slideKind({ blocks: [heading(1, "Amaliyot")] }, 5)).toBe("section");
    expect(slideKind({ blocks: [heading(2, "Nega?"), paragraph("matn")] }, 0)).toBe("plain");
  });
});

describe("cardColumns", () => {
  it("3 tagacha — bir qatorda, 6 ta — 3 ustun", () => {
    expect(cardColumns([card()])).toBe(1);
    expect(cardColumns([card(), card(), card()])).toBe(3);
    expect(cardColumns(Array.from({ length: 6 }, () => card()))).toBe(3);
  });

  it("4 ta qisqa matnli karta — bir qatorda, kodli — 2×2", () => {
    const short = Array.from({ length: 4 }, () => card(paragraph("Kalit va qiymat")));
    const withCode = Array.from({ length: 4 }, () => card(code("python")));
    expect(cardColumns(short)).toBe(4);
    expect(cardColumns(withCode)).toBe(2);
  });
});

describe("columnWeight", () => {
  it("kod bilan boshlangan ustun kengroq, natija (text) — oddiy", () => {
    expect(columnWeight([code("python")])).toBe(1.4);
    expect(columnWeight([{ t: "cards", cards: [card(code("python"))] }])).toBe(1.4);
    expect(columnWeight([{ t: "cards", cards: [card(code("text"))] }])).toBe(1);
    expect(columnWeight([paragraph("matn")])).toBe(1);
  });
});

describe("isOutput", () => {
  it("text va tilsiz blok — ekrandagi natija", () => {
    expect(isOutput(code("text"))).toBe(true);
    expect(isOutput(code(""))).toBe(true);
    expect(isOutput(code("python"))).toBe(false);
  });
});
