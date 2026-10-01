import { ACCOUNTS, expect, expectAccessible, login, test } from "./fixtures";

/**
 * Onlayn o'quvchi (`seed_e2e`: guruhsiz, "frontend" kursida): birinchi darsning testi hali
 * o'tilmagan, shuning uchun keyingi darslar yopiq — sahifa nima qilish kerakligini aytadi.
 */
test.describe("Testdan o'tmaguncha keyingi dars yopiq", () => {
  test("yopiq dars testli darsga yo'naltiradi", async ({ page }) => {
    await login(page, "uz", ACCOUNTS.online);
    await page.goto("/uz/dashboard/courses/frontend");

    const locked = page.getByRole("link", { name: /Oldingi darsning testidan o'ting/ }).first();
    await expect(locked).toBeVisible();
    await locked.click();

    await expect(page.getByRole("heading", { level: 1, name: "Bu dars hali yopiq" })).toBeVisible();
    await expect(
      page.getByText(/darsining testidan o'ting — shunda bu dars ochiladi/),
    ).toBeVisible();
    await expectAccessible(page, "yopiq dars");

    await page.getByRole("link", { name: "Testli darsga o'tish" }).click();
    await expect(page.getByRole("region", { name: "E2E: HTML asoslari" })).toBeVisible();
  });

  test("do'stning taklif havolasi eslab qolinadi", async ({ page, context }) => {
    await page.goto("/uz?ref=abcd2345");

    const cookie = (await context.cookies()).find((item) => item.name === "sifat_ref");
    expect(cookie?.value).toBe("ABCD2345");
    expect(cookie?.httpOnly).toBe(true);
  });
});
