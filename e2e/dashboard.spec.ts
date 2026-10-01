import { expect, expectAccessible, login, test } from "./fixtures";

/** Kabinet ichidagi oqimlar: katalog menyu ichida qoladi, SIFAT Kids ko'rinishi yoqiladi. */
test.describe("Kabinet", () => {
  test("katalog kabinet ichida ochiladi", async ({ page }) => {
    await login(page);

    await page.goto("/uz/dashboard/catalog");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sizga mos kursni tanlang");
    await expectAccessible(page, "kabinet katalogi");

    await page
      .getByRole("heading", { level: 3, name: /SIFAT Kids/ })
      .getByRole("link")
      .click();
    // Kurs sahifasi saytga emas, kabinetning o'ziga ochiladi: chap menyu joyida.
    await expect(page).toHaveURL(/\/uz\/dashboard\/catalog\/sifat-kids$/);
    await expect(page.getByRole("heading", { level: 1, name: /SIFAT Kids/ })).toBeVisible();
    const menu = page.getByRole("navigation", { name: "Kabinet menyusi" });
    await expect(menu.getByRole("link", { name: "Barcha kurslar" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expectAccessible(page, "kabinet: kurs sahifasi");
  });

  test("kabinetda topilmagan kurs menyu bilan ochiladi", async ({ page, problems }) => {
    await login(page);

    await page.goto("/uz/dashboard/catalog/bunday-kurs-yoq");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sahifa topilmadi");
    await expect(page).toHaveTitle(/Sahifa topilmadi/);
    await expect(page.getByRole("navigation", { name: "Kabinet menyusi" })).toBeVisible();
    await expectAccessible(page, "kabinet 404");
    // Kabinet sahifalari oqim bilan keladi (holat 200); 404 bo'lsa brauzer uni konsolga yozadi.
    const rest = problems.filter((problem) => !problem.includes("404 (Not Found)"));
    problems.splice(0, problems.length, ...rest);
  });

  test("SIFAT Kids ko'rinishi sozlamalarda yoqiladi", async ({ page }) => {
    await login(page);

    async function switchTo(label: RegExp) {
      await page.goto("/uz/dashboard/settings");
      await page.getByRole("radio", { name: label }).check();
      await page.getByRole("button", { name: "Saqlash" }).click();
      await expect(page.getByText("Saqlandi")).toBeVisible();
    }

    await switchTo(/SIFAT Kids/);
    try {
      await page.goto("/uz/dashboard");
      await expect(page.getByRole("heading", { level: 1, name: /^Salom/ })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Medallarim" })).toBeVisible();
      await expectAccessible(page, "SIFAT Kids kabineti");
    } finally {
      // Boshqa testlar kattalar kabinetini kutadi.
      await switchTo(/Kattalar uchun/);
    }
  });
});
