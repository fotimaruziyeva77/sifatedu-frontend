import { describe, expect, it } from "vitest";

import { clock } from "./time";

describe("clock", () => {
  it.each([
    [0, "0:00"],
    [5.9, "0:05"],
    [75, "1:15"],
    [3599, "59:59"],
    [3600, "1:00:00"],
    [3725, "1:02:05"],
  ])("%s → %s", (seconds, expected) => {
    expect(clock(seconds)).toBe(expected);
  });

  it("noto'g'ri qiymatda 0:00", () => {
    expect(clock(Number.NaN)).toBe("0:00");
    expect(clock(-3)).toBe("0:00");
    expect(clock(Number.POSITIVE_INFINITY)).toBe("0:00");
  });
});
