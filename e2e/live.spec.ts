import { ACCOUNTS, expect, expectAccessible, login, test } from "./fixtures";

/**
 * Jonli darslar: `seed_e2e` E2E-FE guruhiga 10 daqiqadan keyin boshlanadigan onlayn dars
 * ("Qo'shilish" allaqachon ochiq) va kechagi darsni (yozuv va izoh bilan) qo'yadi, guruh
 * kursining birinchi darsini "o'tilgan" deb belgilaydi.
 */
const NEXT = "E2E: jonli dars";
const PAST = "E2E: o'tgan dars";
const MEET = "https://meet.google.com/e2e-sinov-dars";

test.describe.configure({ mode: "serial" });

test.describe("Jonli darslar", () => {
  test("o'quvchi keyingi darsni ko'radi va qo'shiladi", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("region", { name: "Keyingi jonli dars" })).toContainText(NEXT);

    const menu = page.getByRole("navigation", { name: "Kabinet menyusi" });
    await menu.getByRole("link", { name: "Jadval" }).click();
    await expect(page).toHaveURL(/\/uz\/dashboard\/schedule$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Jadval");

    const upcoming = page.getByRole("region", { name: "Yaqin darslar" });
    const join = upcoming
      .getByRole("listitem")
      .filter({ hasText: NEXT })
      .getByRole("link", { name: "Qo'shilish" });
    await expect(join).toBeVisible();
    // "Qo'shilish" platforma orqali o'tadi: kelgani yoziladi va Meet'ga yo'naltiriladi.
    const href = await join.getAttribute("href");
    expect(href).toMatch(/^\/api\/v1\/live\/\d+\/join\/$/);
    const response = await page.request.get(href ?? "", { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers()["location"]).toBe(MEET);

    const done = page
      .getByRole("region", { name: "O'tgan darslar" })
      .getByRole("listitem")
      .filter({ hasText: PAST });
    await expect(done.getByRole("link", { name: "Yozuvni ko'rish" })).toHaveAttribute(
      "href",
      "https://youtu.be/e2e-sinov",
    );
    await expect(done).toContainText("Flexbox va Grid");
    await expectAccessible(page, "jadval");
  });

  test("o'qituvchi davomatni va o'tilgan darsni belgilaydi", async ({ page }) => {
    await login(page, "uz", ACCOUNTS.teacher);
    await page.goto("/uz/dashboard/teaching");
    await page.getByRole("link", { name: "E2E-FE" }).click();
    await expect(page.getByRole("columnheader", { name: "Davomat" })).toBeVisible();
    await page
      .getByRole("region", { name: "Jonli darslar" })
      .getByRole("link", { name: new RegExp(NEXT) })
      .click();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(NEXT);
    // "Qo'shilish"ni bosgan o'quvchi oldindan belgilangan: qachon qo'shilganiga qarab "Keldi" yoki
    // "Kechikdi" (dars boshlanganidan 10 daqiqa o'tgach). O'qituvchi "Kechikdi" deb saqlaydi.
    const student = page.getByRole("radiogroup", { name: /Sinov.*davomat/ });
    await expect(student.getByRole("radio", { checked: true })).toHaveCount(1);
    await student.getByRole("radio", { name: "Kechikdi" }).check();
    await page.getByRole("button", { name: "Davomatni saqlash" }).click();
    await expect(page.getByText("Saqlandi", { exact: true })).toBeVisible();

    // Dars o'tildi: kursning ikkinchi darsi guruh uchun ochiladi, o'quvchilarga xabar boradi.
    const cover = page.getByRole("region", { name: "Dars o'tildi" });
    await cover.getByLabel("Mavzu").selectOption({ index: 1 });
    await cover.getByRole("button", { name: "Dars o'tildi" }).click();
    await expect(cover).toContainText("o'quvchilarga xabar yuborildi");
    // router.refresh() paytida Next sarlavhani vaqtincha olib tashlaydi: yangilanish tugashini
    // kutamiz (bu sahifada ketma-ket ikkita yangilanish bo'ladi).
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveTitle(/Davomat/);
    await expectAccessible(page, "davomat");
  });

  test("o'quvchi davomat holatini va yangi dars xabarini ko'radi", async ({ page }) => {
    await login(page);
    await page.goto("/uz/dashboard/schedule");

    const row = page
      .getByRole("region", { name: "Yaqin darslar" })
      .getByRole("listitem")
      .filter({ hasText: NEXT });
    await expect(row).toContainText("Kechikdi");
    // Xabar API orqali tekshiriladi: "Xabarlar" sahifasini ochish hammasini o'qilgan qilib qo'yadi,
    // keyingi (xabarlar) test esa o'qilmagan xabarni kutadi.
    const response = await page.request.get("/api/v1/notifications/");
    const body: unknown = await response.json();
    const items = (Array.isArray(body) ? body : (body as { results: unknown[] }).results) as {
      title: string;
    }[];
    expect(items.some((item) => item.title.startsWith("Yangi dars ochildi"))).toBe(true);
  });

  test("o'qituvchi telefonda davomat sahifasini ochadi @mobile", async ({ page }) => {
    await login(page, "uz", ACCOUNTS.teacher);
    await page.goto("/uz/dashboard/teaching");
    await page.getByRole("link", { name: "E2E-FE" }).click();
    await page
      .getByRole("region", { name: "Jonli darslar" })
      .getByRole("link", { name: new RegExp(NEXT) })
      .click();

    await expect(page.getByRole("radiogroup", { name: /Sinov.*davomat/ })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await expectAccessible(page, "davomat telefonda");
  });
});
