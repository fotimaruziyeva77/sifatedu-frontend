import { expect, expectAccessible, login, test } from "./fixtures";

/**
 * Qolgan sahifalar ochiladi, konsolda xato yo'q (masalan, yetishmagan tarjima) va
 * accessibility'da jiddiy xato yo'q. Chuqur oqimlar — site.spec.ts va purchase.spec.ts'da.
 */
test.describe("Smoke", () => {
  for (const path of ["/uz/auth/register", "/ru/auth/forgot-password", "/en/auth/login"]) {
    test(`auth sahifasi ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByLabel(/telefon|телефон|phone/i).first()).toBeVisible();
      await expectAccessible(page, path);
    });
  }

  test("Telegram orqali kirishdan qaytish: imzosiz ma'lumot rad etiladi", async ({ page }) => {
    // Widget `data-auth-url` bilan shu sahifaga qaytaradi (eval'siz — CSP bilan ishlaydi).
    await page.goto("/uz/auth/telegram");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Telegram orqali kirish");
    await expect(
      page.getByRole("alert").filter({ hasText: "Telegram'dan ma'lumot kelmadi" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Kiring", exact: true })).toBeVisible();
    await expectAccessible(page, "telegram qaytish");
  });

  test("kabinet sahifalari", async ({ page }) => {
    await login(page);

    for (const [path, heading] of [
      ["/uz/dashboard", /Salom|Kabinet/],
      ["/uz/dashboard/courses", /Kurslarim/],
      ["/uz/dashboard/orders", /To'lovlarim/],
      ["/uz/dashboard/settings", /Sozlamalar/],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expectAccessible(page, path);
    }
  });

  test("huquqiy sahifa va 404", async ({ page, problems }) => {
    await page.goto("/uz/offer");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const missing = await page.goto("/uz/bunday-sahifa-yoq");
    expect(missing?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectAccessible(page, "404");
    // Brauzer 404 javobini konsolga o'zi yozadi — bu kutilgan holat.
    const expected = problems.filter((problem) => problem.includes("404 (Not Found)"));
    expect(expected).toHaveLength(1);
    problems.splice(problems.indexOf(expected[0]), 1);
  });
});
