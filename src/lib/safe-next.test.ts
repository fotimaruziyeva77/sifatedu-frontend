import { describe, expect, it } from "vitest";

import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("ichki yo'lni qaytaradi", () => {
    expect(safeNext("/dashboard/courses")).toBe("/dashboard/courses");
    expect(safeNext("/courses?category=bolalar")).toBe("/courses?category=bolalar");
  });

  it("til prefiksini olib tashlaydi (aks holda /uz/uz/... bo'lardi)", () => {
    expect(safeNext("/uz/dashboard")).toBe("/dashboard");
    expect(safeNext("/ru/courses/frontend")).toBe("/courses/frontend");
    expect(safeNext("/en")).toBe("/");
  });

  it("til prefiksiga o'xshash so'zlarga tegmaydi", () => {
    expect(safeNext("/uzbek-tili")).toBe("/uzbek-tili");
  });

  it.each([null, undefined, "", "dashboard", "//evil.com", "https://evil.com", "/\\evil.com"])(
    "xavfli yoki bo'sh qiymat (%s) — kabinetga",
    (value) => {
      expect(safeNext(value)).toBe("/dashboard");
    },
  );
});
