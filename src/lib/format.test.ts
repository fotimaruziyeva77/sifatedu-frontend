import { describe, expect, it } from "vitest";

import { formatNumber, initials, stamp } from "./format";

describe("formatNumber", () => {
  it("guruhlab yozadi", () => {
    expect(formatNumber(1490000, "en")).toBe("1,490,000");
  });
});

describe("initials", () => {
  it("ism va familiyadan", () => {
    expect(initials("Aziz Karimov")).toBe("AK");
  });
});

describe("stamp", () => {
  it("Toshkent vaqti bilan, oy nomisiz", () => {
    // 2026-09-30 19:30 UTC = 1-oktabr 00:30 Toshkentda.
    expect(stamp("2026-09-30T19:30:00Z")).toBe("01.10.2026, 00:30");
  });
});
