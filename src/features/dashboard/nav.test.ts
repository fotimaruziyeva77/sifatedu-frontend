import { describe, expect, it } from "vitest";

import { isStaff, NAV_ITEMS, navFor, unreadBadge } from "./nav";

describe("navFor", () => {
  it("o'quvchiga odatiy menyu", () => {
    expect(navFor(["STUDENT"])).toEqual(NAV_ITEMS);
  });

  it("o'qituvchiga bosh sahifadan keyin Guruhlarim va Tekshirish", () => {
    const hrefs = navFor(["STUDENT", "TEACHER"]).map((item) => item.href);

    expect(hrefs.slice(0, 3)).toEqual(["/dashboard", "/dashboard/teaching", "/dashboard/reviews"]);
    expect(hrefs).toHaveLength(NAV_ITEMS.length + 2);
  });

  it("guruhi borlarga Mening kurslarimdan keyin Jadval", () => {
    const hrefs = navFor(["STUDENT"], { schedule: true }).map((item) => item.href);

    expect(hrefs.slice(0, 3)).toEqual(["/dashboard", "/dashboard/courses", "/dashboard/schedule"]);
    expect(navFor(["TEACHER"], { schedule: true }).map((item) => item.href)).toContain(
      "/dashboard/schedule",
    );
    expect(navFor(["STUDENT"]).map((item) => item.href)).not.toContain("/dashboard/schedule");
  });

  it("adminga faqat Tekshirish", () => {
    const hrefs = navFor(["ADMIN"]).map((item) => item.href);

    expect(hrefs).toContain("/dashboard/reviews");
    expect(hrefs).not.toContain("/dashboard/teaching");
  });
});

describe("isStaff", () => {
  it("xodim rollari admin panelga", () => {
    expect(isStaff(["STUDENT"])).toBe(false);
    expect(isStaff(["DIRECTOR"])).toBe(true);
    expect(isStaff([])).toBe(false);
  });
});

describe("unreadBadge", () => {
  it("o'qilmagan xabarlar soni", () => {
    expect(unreadBadge(0)).toBeNull();
    expect(unreadBadge(3)).toBe("3");
    expect(unreadBadge(12)).toBe("9+");
  });

  it("menyuda Xabarlar sozlamalardan oldin", () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);

    expect(hrefs.slice(-2)).toEqual(["/dashboard/notifications", "/dashboard/settings"]);
  });
});
