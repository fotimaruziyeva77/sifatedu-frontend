import { describe, expect, it } from "vitest";

import { journey } from "./path";

describe("journey", () => {
  it("bir raqam — bir xil yo'l (chop etishda ham)", () => {
    expect(journey("SE-2610-ABCDEF")).toEqual(journey("SE-2610-ABCDEF"));
  });

  it("boshqa raqam — boshqa yo'l", () => {
    expect(journey("SE-2610-ABCDEF")).not.toEqual(journey("SE-2610-ABCDEG"));
  });

  it("pastdan boshlanib yuqorida tugaydi, chegaradan chiqmaydi", () => {
    const points = journey("SE-2610-XYZ234", 9);
    expect(points).toHaveLength(9);
    expect(points[0].y).toBeGreaterThan(points[8].y);
    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(1);
      expect(point.y).toBeGreaterThanOrEqual(0.08);
      expect(point.y).toBeLessThanOrEqual(0.92);
    }
  });
});
