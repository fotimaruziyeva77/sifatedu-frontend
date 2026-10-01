import { describe, expect, it } from "vitest";

import { type Priced, priceLines, primaryPrice } from "./price";

const labels = {
  free: "Bepul",
  price: (value: string) => `${value} so'm`,
  once: "bir marta",
  monthly: "oyiga",
};

const course = (overrides: Partial<Priced>): Priced => ({
  is_free: false,
  study_format: "BOTH",
  price_online: 1_800_000,
  price_offline_monthly: 700_000,
  ...overrides,
});

describe("priceLines", () => {
  it("ikkala shaklda ikkala narx birligi bilan", () => {
    const lines = priceLines(course({}), "uz", labels);

    expect(lines.map((line) => line.unit)).toEqual(["bir marta", "oyiga"]);
    expect(lines[0].amount).toMatch(/so'm$/);
  });

  it("faqat onlayn kursda oylik narx ko'rinmaydi", () => {
    const lines = priceLines(course({ study_format: "ONLINE" }), "uz", labels);

    expect(lines.map((line) => line.unit)).toEqual(["bir marta"]);
  });

  it("faqat offlayn kursda bir martalik narx ko'rinmaydi", () => {
    const lines = priceLines(course({ study_format: "OFFLINE" }), "uz", labels);

    expect(lines.map((line) => line.unit)).toEqual(["oyiga"]);
  });

  it("bepul kurs", () => {
    expect(priceLines(course({ is_free: true }), "uz", labels)).toEqual([
      { amount: "Bepul", unit: "" },
    ]);
  });

  it("narx kiritilmagan bo'lsa «bepul» deb yozilmaydi", () => {
    const lines = priceLines(course({ price_online: 0, price_offline_monthly: 0 }), "uz", labels);

    expect(lines).toEqual([{ amount: "—", unit: "" }]);
  });

  it("kartochkada birinchi (onlayn) narx", () => {
    expect(primaryPrice(course({}), "uz", labels).unit).toBe("bir marta");
  });
});
