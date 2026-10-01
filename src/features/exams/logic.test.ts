import { describe, expect, it } from "vitest";

import { clock, firstOpen, nextOpen, timeWarning } from "./logic";

describe("clock", () => {
  it("daqiqa va soniya", () => {
    expect(clock(754)).toBe("12:34");
    expect(clock(59.9)).toBe("00:59");
  });

  it("bir soatdan ko'p", () => {
    expect(clock(3725)).toBe("1:02:05");
  });

  it("vaqt tugagan", () => {
    expect(clock(-5)).toBe("00:00");
  });
});

describe("nextOpen", () => {
  const ids = [10, 20, 30, 40];

  it("keyingi javobsiz savol", () => {
    expect(nextOpen(ids, new Set([20]), 0)).toBe(2);
  });

  it("oxiridan keyin — boshidan (o'tkazib yuborilgan savol)", () => {
    expect(nextOpen(ids, new Set([20, 40]), 2)).toBe(0);
  });

  it("boshqa javobsiz savol yo'q — o'zi", () => {
    expect(nextOpen(ids, new Set([10, 20, 40]), 2)).toBe(2);
  });

  it("hammasi javoblangan", () => {
    expect(nextOpen(ids, new Set(ids), 1)).toBe(-1);
  });
});

describe("firstOpen", () => {
  it("birinchi javobsiz", () => {
    expect(firstOpen([1, 2, 3], new Set([1]))).toBe(1);
  });

  it("hammasi javoblangan — birinchisi", () => {
    expect(firstOpen([1, 2], new Set([1, 2]))).toBe(0);
  });
});

describe("timeWarning", () => {
  it("5 va 1 daqiqa", () => {
    expect(timeWarning(301)).toBeNull();
    expect(timeWarning(300)).toBe("five");
    expect(timeWarning(60)).toBe("one");
  });
});
