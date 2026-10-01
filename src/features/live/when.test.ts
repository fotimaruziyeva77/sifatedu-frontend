import { describe, expect, it } from "vitest";

import { byDay, dayKey, relativeDay } from "./when";

describe("jadval sanalari (Toshkent vaqti)", () => {
  it("kun Toshkent bo'yicha: UTC 20:00 — ertasi kun", () => {
    expect(dayKey("2026-10-05T20:00:00Z")).toBe("2026-10-06");
    expect(dayKey("2026-10-05T18:59:00Z")).toBe("2026-10-05");
  });

  it("bugun va ertaga", () => {
    const now = new Date("2026-10-05T10:00:00Z");

    expect(relativeDay("2026-10-05T13:00:00Z", now)).toBe("today");
    expect(relativeDay("2026-10-06T13:00:00Z", now)).toBe("tomorrow");
    expect(relativeDay("2026-10-08T13:00:00Z", now)).toBeNull();
  });

  it("darslar kunlar bo'yicha guruhlanadi", () => {
    const groups = byDay([
      { id: 1, starts_at: "2026-10-05T08:00:00Z" },
      { id: 2, starts_at: "2026-10-05T13:00:00Z" },
      { id: 3, starts_at: "2026-10-07T13:00:00Z" },
    ]);

    expect(groups.map((group) => [group.day, group.items.map((item) => item.id)])).toEqual([
      ["2026-10-05", [1, 2]],
      ["2026-10-07", [3]],
    ]);
  });
});
