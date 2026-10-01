import { ACCOUNTS, expect, expectAccessible, login, test } from "./fixtures";

/**
 * Uy vazifasi to'liq: o'quvchi javob yuboradi (izoh, kod, rasm) → o'qituvchi baholaydi →
 * o'quvchi natijani ko'radi. `seed_e2e` guruh kursining birinchi darsiga vazifa qo'yadi va
 * o'quvchining oldingi javoblarini o'chiradi.
 */
const TITLE = "E2E: shaxsiy sahifa";
// 1×1 PNG: backend rasmni Pillow bilan tekshiradi, shuning uchun haqiqiy rasm kerak.
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.describe.configure({ mode: "serial" });

test.describe("Uy vazifasi", () => {
  test("o'quvchi javob yuboradi", async ({ page }) => {
    await login(page);
    const menu = page.getByRole("navigation", { name: "Kabinet menyusi" });
    await menu.getByRole("link", { name: /^Vazifalar/ }).click();

    await expect(page).toHaveURL(/\/uz\/dashboard\/homework$/);
    const todo = page.getByRole("region", { name: /Topshirilmagan/ });
    await todo.getByRole("link", { name: new RegExp(TITLE) }).click();

    const panel = page.getByRole("region", { name: TITLE });
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Topshirilmagan");
    await panel.getByLabel("Izoh").fill("Sahifa tayyor, rangini o'zim tanladim.");
    await panel.getByRole("button", { name: "Kod qo'shish" }).click();
    await panel.getByLabel("Kod", { exact: true }).fill("<h1>Sinov</h1>");
    await panel.locator('input[type="file"]').setInputFiles({
      name: "sahifa.png",
      mimeType: "image/png",
      buffer: PIXEL,
    });
    await expect(panel.getByText("sahifa.png")).toBeVisible();
    await panel.getByRole("button", { name: "Yuborish" }).click();

    await expect(panel).toContainText("Javobingiz o'qituvchiga yuborildi");
    await expect(panel.getByRole("img", { name: "sahifa.png" })).toBeVisible();
    // router.refresh() paytida Next metadata'ni qayta yozadi: sarlavha qaytgach tekshiramiz.
    await expect(page).toHaveTitle(/E2E|Birinchi/);
    await expectAccessible(page, "uy vazifasi: yuborilgan");
  });

  test("o'qituvchi baho qo'yadi", async ({ page }) => {
    await login(page, "uz", ACCOUNTS.teacher);
    const menu = page.getByRole("navigation", { name: "Kabinet menyusi" });
    await menu.getByRole("link", { name: /^Tekshirish/ }).click();

    await expect(page).toHaveURL(/\/uz\/dashboard\/reviews$/);
    await expectAccessible(page, "tekshirish: navbat");
    await page.getByRole("link", { name: /Sinov/ }).first().click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Sinov");
    await expect(page.getByText("<h1>Sinov</h1>")).toBeVisible();
    await page.getByLabel("Baho (0–100)").fill("95");
    await page.getByLabel("Izoh").fill("Juda yaxshi! Sarlavhaga rang bering.");
    await page.getByRole("button", { name: "Qabul qilish" }).click();

    // Sahifa serverdan yangilanadi: qaror va izoh ko'rinadi, forma yo'qoladi.
    await expect(page.getByText("95/100")).toBeVisible();
    await expect(page.getByText("Juda yaxshi! Sarlavhaga rang bering.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Qabul qilish" })).toHaveCount(0);
    await expect(page).toHaveTitle(/Sinov/);
    await expectAccessible(page, "tekshirish: javob");
  });

  test("o'quvchi natijani ko'radi", async ({ page }) => {
    await login(page);
    await page.goto("/uz/dashboard/homework");

    const accepted = page.getByRole("region", { name: /Qabul qilingan/ });
    await expect(accepted.getByText("Qabul · 95/100")).toBeVisible();
    await accepted.getByRole("link", { name: new RegExp(TITLE) }).click();

    const panel = page.getByRole("region", { name: TITLE });
    await expect(panel).toContainText("Qabul qilindi — 95/100");
    await expect(panel).toContainText("Juda yaxshi! Sarlavhaga rang bering.");
    // Qabul qilingan vazifaga yangi javob yuborilmaydi.
    await expect(panel.getByRole("button", { name: "Yuborish" })).toHaveCount(0);
  });
});
