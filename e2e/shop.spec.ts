import { expect, expectAccessible, login, test } from "./fixtures";

/**
 * Coin do'koni: `seed_e2e` arzon sovg'a (20 coin, zaxira 5) va qimmatini (500 coin) qo'yadi.
 * O'quvchining coini (seed + oldingi spec'lar) arzoniga yetadi, qimmatiga — yo'q.
 */
test.describe.configure({ mode: "serial" });

test.describe("Do'kon", () => {
  test("o'quvchi sovg'a oladi, coin yechiladi, buyurtma ko'rinadi", async ({ page }) => {
    await login(page);
    await page
      .getByRole("navigation", { name: "Kabinet menyusi" })
      .getByRole("link", { name: "Do'kon" })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Do'kon");
    const balance = page.locator(".shop-balance strong");
    const before = Number((await balance.textContent())?.replace(/\D/g, ""));

    const shirt = page.getByRole("article", { name: "E2E: futbolka" });
    await expect(shirt.getByRole("button", { name: /coin kerak/ })).toBeDisabled();
    await expectAccessible(page, "do'kon");

    const stickers = page.getByRole("article", { name: "E2E: stikerlar to'plami" });
    await expect(stickers).toContainText("5 ta qoldi");
    page.once("dialog", (dialog) => void dialog.accept());
    await stickers.getByRole("button", { name: "«E2E: stikerlar to'plami»ni olish" }).click();

    await expect(page.getByText(/buyurtma qilindi/)).toBeVisible();
    await expect(balance).toHaveText(String(before - 20));
    await expect(stickers).toContainText("4 ta qoldi");

    await page.getByRole("link", { name: "Buyurtmalarim" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Buyurtmalarim");
    const order = page.locator(".shop-order").filter({ hasText: "E2E: stikerlar to'plami" });
    await expect(order.locator(".shop-status")).toHaveText("Yangi");
    await expectAccessible(page, "buyurtmalarim");
  });
});
