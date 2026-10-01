import type { Locator, Page } from "@playwright/test";

import { ACCOUNTS, expect, expectAccessible, login, test } from "./fixtures";

/**
 * Dars testi: `seed_e2e` guruh kursining birinchi darsiga 5 turdagi savol qo'yadi (tartibi
 * aralashtirilmaydi, variantlar esa aralash) va o'quvchining oldingi urinishlarini o'chiradi.
 * Bitta ataylab xato → 80%, 2 yulduz, dars tugatiladi.
 */
const TITLE = "E2E: HTML asoslari";
const STEPS = ["HTML o'qiladi", "CSS qo'llanadi", "JavaScript ishga tushadi"];
const PAIRS = { HTML: "tuzilma", CSS: "ko'rinish", JavaScript: "harakat" };

test.describe.configure({ mode: "serial" });

async function openLesson(page: Page): Promise<Locator> {
  await page.goto("/uz/dashboard/courses/frontend");
  // Kurs dasturida testli dars yulduzlari bilan ko'rinadi.
  await page
    .getByRole("link", { name: /Test: 3 tadan \d yulduz/ })
    .first()
    .click();
  const panel = page.getByRole("region", { name: TITLE });
  await expect(panel).toBeVisible();
  return panel;
}

/** Yangi urinish: tugallanmagani bo'lsa (masalan, telefon testidan) — boshidan. */
async function startFresh(panel: Locator): Promise<void> {
  const restart = panel.getByRole("button", { name: "Boshidan boshlash" });
  if (await restart.isVisible()) await restart.click();
  else {
    // Bot sozlangan bo'lsa, asosiy tugma — "Telegram'da ishlash", sayt — "Saytda ishlash".
    await panel
      .getByRole("button", { name: /^(Testni boshlash|Qayta ishlash|Saytda ishlash)$/ })
      .click();
  }
  await expect(panel.getByRole("heading", { name: "HTML nimaning qisqartmasi?" })).toBeFocused();
}

async function check(panel: Locator, verdict: "To'g'ri!" | "Noto'g'ri"): Promise<void> {
  await panel.getByRole("button", { name: "Tekshirish" }).click();
  await expect(panel.locator(".quiz-feedback__title")).toHaveText(verdict);
}

test.describe("Dars testi", () => {
  test("o'quvchi 5 turdagi savolni ishlaydi", async ({ page }) => {
    await login(page);
    const panel = await openLesson(page);
    await expect(panel).toContainText("5 ta savol · o'tish uchun 70%");
    await startFresh(panel);

    // 1. Bitta javob: to'g'ri. Izoh va to'g'ri javoblar test o'tilgach ko'rsatiladi.
    await expect(panel.getByText("5 tadan 1-savol")).toBeVisible();
    await panel.getByRole("radio", { name: /HyperText Markup Language/ }).check();
    await check(panel, "To'g'ri!");
    await expect(panel).not.toContainText("belgilash tili.");
    await expectAccessible(page, "test: javobdan keyin");
    await panel.getByRole("button", { name: "Keyingi savol" }).click();

    // 2. Bir nechta javob — ataylab chala: to'g'ri javob hali aytilmaydi.
    await panel.getByRole("checkbox", { name: /<div>/ }).check();
    await check(panel, "Noto'g'ri");
    await expect(panel.getByText("to'g'ri javob", { exact: true })).toHaveCount(0);
    await expect(panel).toContainText("To'g'ri javoblar test o'tilgach ko'rsatiladi.");
    await expect(panel).not.toContainText("<color> degan teg yo'q");
    await panel.getByRole("button", { name: "Keyingi savol" }).click();

    // 3. Matn: katta harf va ortiqcha belgilar farq qilmaydi.
    const input = panel.getByLabel("Javobingiz");
    await input.fill("H1");
    await input.press("Enter");
    await expect(panel.locator(".quiz-feedback__title")).toHaveText("To'g'ri!");
    await expect(panel.getByText("2 ta ketma-ket to'g'ri")).toHaveCount(0);
    await panel.getByRole("button", { name: "Keyingi savol" }).click();

    // 4. Tartiblash: ↑ tugmalari bilan to'g'ri tartibga keltiramiz.
    const items = panel.locator(".quiz-order__text");
    for (const [target, step] of STEPS.entries()) {
      const texts = await items.allTextContents();
      for (let index = texts.indexOf(step); index > target; index--) {
        await panel.getByRole("button", { name: `«${step}» — yuqoriga` }).click();
      }
    }
    await expect(items).toHaveText(STEPS);
    await check(panel, "To'g'ri!");
    await expect(panel.getByText("2 ta ketma-ket to'g'ri")).toBeVisible();
    await panel.getByRole("button", { name: "Keyingi savol" }).click();

    // 5. Moslashtirish: chapdagisi o'zi tanlanadi, o'ngdagi juftini bosamiz.
    const left = panel.getByRole("list", { name: "Chap ustun" });
    const right = panel.getByRole("list", { name: "O'ng ustun" });
    for (const [item, partner] of Object.entries(PAIRS)) {
      await expect(left.getByRole("button", { name: item, exact: true })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await right.getByRole("button", { name: partner }).click();
    }
    await check(panel, "To'g'ri!");
    await panel.getByRole("button", { name: "Natijani ko'rish" }).click();

    // Yakun: 4/5 → 80%, 2 yulduz, dars tugatildi; xatolar ustida ishlash — 2-savol.
    await expect(panel.getByRole("heading", { name: "80%" })).toBeFocused();
    await expect(panel.getByRole("img", { name: "3 tadan 2 yulduz" })).toBeVisible();
    await expect(panel).toContainText("Test o'tildi!");
    await expect(panel).toContainText("Dars tugatildi");
    const mistakes = panel.getByRole("listitem").filter({ hasText: "Qaysilari HTML teglari?" });
    await expect(mistakes).toContainText("Sizning javobingiz:");
    await expect(mistakes).toContainText("<div>");
    await expect(mistakes).toContainText("<p>");
    await expect(mistakes).toContainText("<color> degan teg yo'q");
    await expect(panel.getByRole("link", { name: "Keyingi dars" })).toBeVisible();
    // router.refresh() paytida Next metadata'ni qayta yozadi: sarlavha qaytgach tekshiramiz.
    await expect(page).toHaveTitle(/E2E|Birinchi/);
    await expectAccessible(page, "test: natija");

    // Kartada eng yaxshi natija, dasturda — yulduzlar.
    await panel.getByRole("button", { name: "Yopish" }).click();
    await expect(panel).toContainText("O'tildi");
    await expect(panel).toContainText("Eng yaxshi natija: 80%");
    await expect(panel.getByRole("img", { name: "3 tadan 2 yulduz" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Test: 3 tadan 2 yulduz/ })).toBeVisible();
  });

  test("o'qituvchi guruh sahifasida natijani ko'radi", async ({ page }) => {
    await login(page, "uz", ACCOUNTS.teacher);
    await page.goto("/uz/dashboard/teaching");
    await page.getByRole("link", { name: "E2E-FE" }).click();

    await expect(page.getByRole("columnheader", { name: "Testlar" })).toBeVisible();
    const row = page.getByRole("row").filter({ hasText: "Sinov" });
    await expect(row).toContainText("1 ta o'tilgan");
    await expect(row).toContainText("o'rtacha 80%");
  });

  test("telefonda to'xtatib, keyin davom ettiradi @mobile", async ({ page }) => {
    await login(page);
    const panel = await openLesson(page);
    await startFresh(panel);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await panel.getByRole("radio", { name: /HyperText Markup Language/ }).check();
    await check(panel, "To'g'ri!");
    await panel.getByRole("button", { name: "Keyinroq davom ettirish" }).click();

    // Javoblar saqlangan: davom ettirilganda 2-savoldan boshlanadi.
    await panel.getByRole("button", { name: /^(Saytda davom ettirish|Davom ettirish)$/ }).click();
    await expect(panel.getByRole("heading", { name: "Qaysilari HTML teglari?" })).toBeFocused();
    await expect(panel.getByText("5 tadan 2-savol")).toBeVisible();
    await expectAccessible(page, "test: davom ettirish");
    await panel.getByRole("button", { name: "Keyinroq davom ettirish" }).click();
  });
});
