import { describe, expect, it } from "vitest";

import { rebrandMessages } from "./rebrand-messages";

const MESSAGES = {
  Footer: { rights: "© {year} Sifat Edu" },
  Dashboard: { nested: { kids: "SIFAT Kids", plain: "Kabinet" } },
};

describe("rebrandMessages", () => {
  it("ichma-ich hamma joyda nomni almashtiradi", () => {
    const result = rebrandMessages(MESSAGES, "uz", "Najot Ta'lim");
    expect(result.Footer).toEqual({ rights: "© {year} Najot Ta'lim" });
    expect(result.Dashboard).toEqual({ nested: { kids: "Kids", plain: "Kabinet" } });
  });

  it("asl tarjimalarni o'zgartirmaydi", () => {
    rebrandMessages(MESSAGES, "ru", "Boshqa");
    expect(MESSAGES.Footer.rights).toBe("© {year} Sifat Edu");
  });

  it("shablon belgilarini nomdan olib tashlaydi", () => {
    const result = rebrandMessages(MESSAGES, "en", "A{b}<c>");
    expect(result.Footer).toEqual({ rights: "© {year} Abc" });
  });
});
