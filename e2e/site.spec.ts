import { expect, expectAccessible, test } from "./fixtures";

test.describe("Ommaviy sahifalar", () => {
  test("bosh sahifa tanlangan tilga yo'naltiradi", async ({ request }) => {
    const response = await request.get("/", { maxRedirects: 0 });

    expect(response.status()).toBe(307);
    expect(response.headers().location).toMatch(/^\/(uz|ru|en)$/);
  });

  for (const locale of ["uz", "ru", "en"] as const) {
    test(`landing (${locale}) @mobile`, async ({ page }) => {
      const response = await page.goto(`/${locale}`);

      expect(response?.status()).toBe(200);
      // CSP har so'rovda yangi nonce bilan keladi.
      expect(response?.headers()["content-security-policy"]).toMatch(/'nonce-[^']+'/);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectAccessible(page, `landing ${locale}`);
    });
  }

  test("katalog: filtr va kurs sahifasi", async ({ page }) => {
    await page.goto("/uz/courses");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectAccessible(page, "katalog");

    await page.getByRole("button", { name: /Bolalar uchun/ }).click();
    await expect(page).toHaveURL(/category=bolalar/);
    const card = page.getByRole("heading", { level: 3, name: /SIFAT Kids/ });
    await expect(card).toBeVisible();

    // Kartochka kurs sahifasiga olib boradi.
    await card.getByRole("link").click();
    await expect(page).toHaveURL(/\/uz\/courses\/sifat-kids$/);
    await expect(page.getByRole("heading", { level: 1, name: /SIFAT Kids/ })).toBeVisible();
    // Ikki narx: onlayn (bir marta) va offlayn (oyiga).
    await expect(page.getByText("bir marta", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("oyiga", { exact: false }).first()).toBeVisible();
    await expectAccessible(page, "kurs sahifasi");
  });

  test("noma'lum kurs va sahifa haqiqiy 404 qaytaradi", async ({ request }) => {
    for (const path of ["/uz/courses/bunday-kurs-yoq", "/ru/bunday-sahifa-yoq"]) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
  });

  test("kabinet kirmagan foydalanuvchini kirish sahifasiga yuboradi", async ({ request }) => {
    const response = await request.get("/ru/dashboard/orders", { maxRedirects: 0 });

    expect(response.status()).toBe(307);
    // `next` til prefiksisiz: kirgandan keyin /ru/ru/... bo'lib qolmasligi uchun.
    expect(response.headers().location).toBe("/ru/auth/login?next=%2Fdashboard%2Forders");
  });
});
