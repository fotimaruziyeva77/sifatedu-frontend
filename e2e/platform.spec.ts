import { expect, expectAccessible, test } from "./fixtures";

/** Markaz ochish oxirigacha backend testida (`test_signup.py`): sxema yaratish qimmat. */
const PLATFORM = process.env.E2E_PLATFORM_URL ?? "http://platform.localhost";
const UNKNOWN_CENTER = "http://bunday-markaz-yoq.localhost";

test.describe("Platforma sayti", () => {
  test("bosh sahifa, tariflar va forma @mobile", async ({ page }) => {
    await page.goto(`${PLATFORM}/uz`);

    await expect(page.getByRole("heading", { level: 1 })).toContainText("tizimda");
    await expect(page.getByRole("columnheader", { name: /Standart/ })).toBeVisible();
    await expectAccessible(page, "platforma sayti");

    await page.getByRole("link", { name: "Standart tarifida markazni ochish" }).click();
    await expect(page).toHaveURL(/\/uz\/signup\?plan=/);
    await expect(page.getByRole("heading", { level: 1, name: "Markazni ochish" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Standart" })).toBeChecked();
    await expectAccessible(page, "markaz ochish formasi");
  });

  test("manzil nomdan taklif qilinadi va tekshiriladi", async ({ page }) => {
    await page.goto(`${PLATFORM}/uz/signup`);

    await page.getByLabel("Markaz nomi").fill("Yangi Ta'lim Markazi");
    const address = page.getByLabel("Sayt manzili");
    await expect(address).toHaveValue("yangi-talim-markazi");
    await expect(page.getByText("Bu manzil bo'sh")).toBeVisible();

    await address.fill("admin");
    await expect(page.getByText("Bu manzilni olib bo'lmaydi")).toBeVisible();

    await address.fill("a");
    await expect(page.getByText(/3–30 belgi/)).toBeVisible();
  });

  test("markaz manzilida platforma sahifalari ochilmaydi", async ({ page, problems }) => {
    await page.goto("/uz/platform/signup");

    await expect(page.getByRole("heading", { level: 1, name: "Sahifa topilmadi" })).toBeVisible();
    // Sahifaning o'zi 404 — brauzer buni konsolga yozadi.
    problems.splice(0, problems.length, ...problems.filter((p) => !p.includes("404 (Not Found)")));
  });

  test("noma'lum manzilda markaz yo'qligi aytiladi", async ({ page }) => {
    await page.goto(`${UNKNOWN_CENTER}/uz`);

    await expect(
      page.getByRole("heading", { level: 1, name: "Bu manzilda o'quv markazi yo'q" }),
    ).toBeVisible();
  });
});
