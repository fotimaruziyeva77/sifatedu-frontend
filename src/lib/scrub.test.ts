import { describe, expect, it } from "vitest";

import { maskPhones, PHONE_MASK, withoutQuery } from "./scrub";

describe("maskPhones", () => {
  it.each(["+998901234567", "998901234567", "+998 90 123 45 67", "+998-90-123-45-67"])(
    "%s ni yashiradi",
    (phone) => {
      expect(maskPhones(`Raqam: ${phone}.`)).toBe(`Raqam: ${PHONE_MASK}.`);
    },
  );

  it("boshqa raqamlarga tegmaydi", () => {
    expect(maskPhones("Buyurtma #12345, summa 1800000")).toBe("Buyurtma #12345, summa 1800000");
  });
});

describe("withoutQuery", () => {
  it("query va hash'ni olib tashlaydi", () => {
    expect(withoutQuery("/uz/payment/result?order=5&sig=x")).toBe("/uz/payment/result");
    expect(withoutQuery("/uz/courses#program")).toBe("/uz/courses");
    expect(withoutQuery("/uz")).toBe("/uz");
  });
});
