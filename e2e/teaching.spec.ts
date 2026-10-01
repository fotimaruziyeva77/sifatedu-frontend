import { ACCOUNTS, expect, expectAccessible, login, test } from "./fixtures";

/** O'qituvchi kabineti: `seed_e2e` ustozi va uning E2E-FE guruhi (test o'quvchisi bilan). */
test.describe("O'qituvchi", () => {
  test("guruhlari va o'quvchilarining progressi", async ({ page }) => {
    await login(page, "uz", ACCOUNTS.teacher);

    const menu = page.getByRole("navigation", { name: "Kabinet menyusi" });
    await expect(menu.getByRole("link", { name: "Boshqaruv paneli" })).toHaveAttribute(
      "href",
      "/admin/",
    );
    await menu.getByRole("link", { name: "Guruhlarim" }).click();

    await expect(page).toHaveURL(/\/uz\/dashboard\/teaching$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Guruhlarim");
    await expectAccessible(page, "o'qituvchi: guruhlar");

    await page.getByRole("link", { name: "E2E-FE" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E-FE");
    const student = page.getByRole("rowheader", { name: /Sinov/ });
    await expect(student).toBeVisible();
    await expect(student.getByRole("link", { name: /qo'ng'iroq/ })).toHaveAttribute(
      "href",
      "tel:+998900009999",
    );
    await expectAccessible(page, "o'qituvchi: guruh sahifasi");
  });

  test("o'quvchi bu bo'limni ko'rmaydi", async ({ page }) => {
    await login(page);

    const menu = page.getByRole("navigation", { name: "Kabinet menyusi" });
    await expect(menu.getByRole("link", { name: "Guruhlarim" })).toHaveCount(0);
    await expect(menu.getByRole("link", { name: "Boshqaruv paneli" })).toHaveCount(0);
    const response = await page.goto("/uz/dashboard/teaching");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sahifa topilmadi");
    expect(response?.status()).toBe(200); // kabinet javobi oqim bilan keladi (loading.tsx)
  });
});
