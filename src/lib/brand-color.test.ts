import { describe, expect, it } from "vitest";

import { brandCss, contrast } from "./brand-color";

function token(css: string, name: string, scope: "root" | "dark" = "root"): string {
  const block = css.split("html.dark")[scope === "root" ? 0 : 1];
  const match = block.match(new RegExp(`--${name}:(#[0-9a-f]{6})`));
  if (!match) throw new Error(`${name} topilmadi`);
  return match[1];
}

describe("brandCss", () => {
  it("noto'g'ri qiymatni o'tkazmaydi", () => {
    expect(brandCss("")).toBe("");
    expect(brandCss("red;}body{display:none")).toBe("");
    expect(brandCss("#12345")).toBe("");
  });

  it("och rangda tugma matni to'q, to'q rangda oq", () => {
    expect(token(brandCss("#ffd400"), "primary-foreground")).toBe("#121427");
    expect(token(brandCss("#0b3d91"), "primary-foreground")).toBe("#ffffff");
  });

  it.each(["#ffd400", "#00c2ff", "#0b3d91", "#111111", "#ffffff", "#e31e24"])(
    "%s: kichik matn ikkala temada o'qiladi",
    (color) => {
      const css = brandCss(color);
      expect(contrast(token(css, "caret-text"), "#f6f7fc")).toBeGreaterThanOrEqual(4.5);
      expect(contrast(token(css, "caret-text", "dark"), "#0b0d1a")).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("tanlangan rang tugmada o'zgarmaydi", () => {
    expect(token(brandCss("#2563eb"), "primary")).toBe("#2563eb");
  });
});
