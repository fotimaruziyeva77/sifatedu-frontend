import { ACCOUNTS, expect, expectAccessible, login, test } from "./fixtures";

/**
 * XP va coin: `seed_e2e` o'quvchiga 2 ta mukofot va 1 ta shtraf (kechikish) yozadi, bugungi
 * 2 ta topshiriq beradi (biri — botda takrorlash); onlayn o'quvchi ham reytingda va ustoz
 * taklifi bilan kelgan — birinchi to'lovga chegirma. Oldingi spec'lar (test, vazifa, davomat)
 * o'quvchiga yana XP qo'shadi, shuning uchun aniq raqamlar tekshirilmaydi.
 */
test.describe.configure({ mode: "serial" });

test.describe("Yutuqlar", () => {
  test("o'quvchi XP, coin, topshiriqlar va tarixni ko'radi", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("region", { name: "Yutuqlarim" })).toContainText("XP");
    await page
      .getByRole("navigation", { name: "Kabinet menyusi" })
      .getByRole("link", { name: "Yutuqlar" })
      .click();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Yutuqlar");
    const balance = page.getByRole("region", { name: "Hisobingiz" });
    await expect(balance.locator(".rw-stat__value").first()).toHaveText(/^\d[\d\s,]*$/);

    const today = page.getByRole("region", { name: "Bugungi topshiriqlar" });
    await expect(today.getByRole("listitem")).toHaveCount(2);
    await expect(today).toContainText("Telegram botda takrorlang: 5 ta savol");

    const history = page.getByRole("region", { name: "Tarix" });
    const late = history.getByRole("listitem").filter({ hasText: "Darsga kechikildi" });
    await expect(late.first()).toContainText("−5 XP");
    await expect(history).toContainText("Dars tugatildi");

    await expect(page.getByRole("region", { name: "Do'stni taklif qilish" })).toContainText(
      "?ref=",
    );
    await page.getByText("XP qanday topiladi va yo'qotiladi").click();
    await expect(page.getByText("Dars tugatildi — +10")).toBeVisible();
    await expectAccessible(page, "yutuqlar");
  });

  test("reyting: kurs bo'yicha va o'z o'rni", async ({ page }) => {
    await login(page);
    await page.goto("/uz/dashboard/rating");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Reyting");
    // O'quvchida bir nechta kurs bo'lishi mumkin (to'lov testi): guruh kursini tanlaymiz.
    const course = page.getByRole("link", { name: /^Kurs: Frontend/ });
    if (await course.count()) await course.click();

    const board = page.locator(".rt-board");
    await expect(board).toContainText("Onlayn");
    await expect(board).toContainText("Sinov");
    await expect(board.locator("li[data-me]")).toContainText("siz");
    await expect(page.locator(".rt-me")).toContainText("Sizning o'rningiz:");
    await expectAccessible(page, "reyting");

    await page.getByRole("link", { name: "Umumiy" }).click();
    await expect(page).toHaveURL(/period=all/);
    await expect(page.getByRole("link", { name: "Umumiy" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("reytingda ko'rinmaslik sozlamasi", async ({ page }) => {
    await login(page);
    await page.goto("/uz/dashboard/settings");

    await page.getByLabel(/Reytingda ko'rsatilmasin/).check();
    await expect(page.getByText("Saqlandi", { exact: true })).toBeVisible();
    await page.goto("/uz/dashboard/rating");
    const course = page.getByRole("link", { name: /^Kurs: Frontend/ });
    if (await course.count()) await course.click();
    await expect(page.locator(".rt-board")).not.toContainText("Sinov");
    await expect(page.locator(".rt-me")).toContainText("Siz reytingda ko'rinmaysiz");

    await page.goto("/uz/dashboard/settings");
    await page.getByLabel(/Reytingda ko'rsatilmasin/).uncheck();
    await expect(page.getByText("Saqlandi", { exact: true })).toBeVisible();
  });

  test("o'qituvchi shtrafni bekor qiladi", async ({ page }) => {
    await login(page, "uz", ACCOUNTS.teacher);
    await page.goto("/uz/dashboard/teaching");
    await page.getByRole("link", { name: "E2E-FE" }).click();
    const penalties = page.getByRole("region", { name: "Shtraflar" });
    const late = penalties.getByRole("listitem").filter({ hasText: "E2E: jonli dars" });
    await expect(late).toContainText("Darsga kechikildi");

    page.once("dialog", (dialog) => void dialog.accept("Tirbandlik — oldindan xabar bergan"));
    await late.getByRole("button", { name: /shtrafni bekor qilish/ }).click();

    await expect(late).toContainText("Bekor qilingan: Tirbandlik — oldindan xabar bergan");
    await expectAccessible(page, "o'qituvchi: shtraflar");
  });

  test("taklif bilan kelgan do'stga birinchi to'lovda chegirma", async ({ page }) => {
    await login(page, "uz", ACCOUNTS.online);
    await page.goto("/uz/courses/praktikum-backend");

    await expect(
      page.getByText("Do'stingiz taklifi bilan birinchi to'lovga 10% chegirma"),
    ).toBeVisible();
    await expect(page.locator(".buy-total__old")).toBeVisible();
  });
});
