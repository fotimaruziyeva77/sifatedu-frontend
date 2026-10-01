import { expect, expectAccessible, login, test } from "./fixtures";

/** Xabarlar: `seed_e2e` test o'quvchisiga bitta o'qilmagan xabar qo'yadi. */
test.describe("Xabarlar", () => {
  test("xabar ko'rinadi va o'qilgan bo'ladi", async ({ page }) => {
    await login(page);

    const menu = page.getByRole("navigation", { name: "Kabinet menyusi" });
    // Oldingi testlar ham xabar qoldiradi (uy vazifasi baholandi va h.k.): soni muhim emas.
    await expect(menu.getByText(/\d+ ta yangi/)).toHaveCount(1);
    await menu.getByRole("link", { name: /^Xabarlar/ }).click();

    await expect(page).toHaveURL(/\/uz\/dashboard\/notifications$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Xabarlar");
    const item = page.getByRole("listitem").filter({ hasText: "E2E: ertaga dars 19:00 da" });
    await expect(item).toBeVisible();
    await expect(item).toContainText("Guruh darsi bir soat kechroq boshlanadi.");
    await expect(item.getByRole("link", { name: "Ochish" })).toHaveAttribute(
      "href",
      "/uz/dashboard/courses",
    );
    // Sahifa ochilgach o'qilgan deb belgilanadi: menyudagi son yo'qoladi.
    await expect(menu.getByText(/ta yangi/)).toHaveCount(0);
    await expectAccessible(page, "xabarlar");
  });

  test("sozlamalarda aksiyalar roziligi saqlanadi", async ({ page }) => {
    await login(page);
    await page.goto("/uz/dashboard/settings");

    const section = page.getByRole("region", { name: "Xabarnomalar" });
    const consent = section.getByRole("checkbox", { name: /Aksiya va yangiliklarni/ });
    await expect(consent).not.toBeChecked();
    await consent.check();
    await expect(consent).toBeChecked();
    await page.reload();
    await expect(consent).toBeChecked();
    await expectAccessible(page, "sozlamalar: xabarnomalar");

    await consent.uncheck();
    await expect(consent).not.toBeChecked();
  });
});
