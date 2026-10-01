import type { Locator, Page } from "@playwright/test";

import { ACCOUNTS, expect, expectAccessible, login, test } from "./fixtures";

/**
 * Oylik imtihon: `seed_e2e` guruh kursida ochiq imtihon qo'yadi (5 savol — dars testidan, aralash
 * tartibda; 2 ta amaliy topshiriq) va o'quvchining sertifikatini (doimiy raqam bilan) yaratadi.
 * O'quvchi testni ishlaydi (natija aytilmaydi) → topshiriq yuboradi → o'qituvchi baholaydi.
 */
const STEPS = ["HTML o'qiladi", "CSS qo'llanadi", "JavaScript ishga tushadi"];
const PAIRS = { HTML: "tuzilma", CSS: "ko'rinish", JavaScript: "harakat" };
const TASK = "E2E: portfolio sahifasi";
const CERTIFICATE = "SE-2601-E2ESNV";

test.describe.configure({ mode: "serial" });

/** Joriy savolga (qaysi turdaligi sarlavhasidan bilinadi) to'g'ri javob tanlanadi. */
async function answer(part: Locator): Promise<void> {
  const question = (await part.locator(".quiz-question").textContent()) ?? "";
  if (question.startsWith("HTML nimaning")) {
    await part.getByRole("radio", { name: /HyperText Markup Language/ }).check();
  } else if (question.startsWith("Qaysilari")) {
    await part.getByRole("checkbox", { name: /<div>/ }).check();
    await part.getByRole("checkbox", { name: /<p>/ }).check();
  } else if (question.startsWith("Eng katta")) {
    await part.getByLabel("Javobingiz").fill("h1");
  } else if (question.startsWith("Brauzer")) {
    const items = part.locator(".quiz-order__text");
    for (const [target, step] of STEPS.entries()) {
      const texts = await items.allTextContents();
      for (let index = texts.indexOf(step); index > target; index--) {
        await part.getByRole("button", { name: `«${step}» — yuqoriga` }).click();
      }
    }
    await expect(items).toHaveText(STEPS);
  } else {
    const left = part.getByRole("list", { name: "Chap ustun" });
    const right = part.getByRole("list", { name: "O'ng ustun" });
    for (const [item, partner] of Object.entries(PAIRS)) {
      await expect(left.getByRole("button", { name: item, exact: true })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await right.getByRole("button", { name: partner }).click();
    }
  }
}

async function save(part: Locator): Promise<void> {
  await part.getByRole("button", { name: "Javobni saqlash" }).click();
  // Natija aytilmaydi: faqat "saqlandi".
  await expect(part.locator(".quiz-feedback__title")).toHaveText("Javob saqlandi");
  await expect(part.getByText("To'g'ri!")).toHaveCount(0);
  await expect(part.getByText("Noto'g'ri", { exact: true })).toHaveCount(0);
}

async function openExam(page: Page): Promise<Locator> {
  await page.goto("/uz/dashboard");
  const callout = page.getByRole("region", { name: /Oylik imtihon ochiq/ });
  await expect(callout).toBeVisible();
  await callout.getByRole("link", { name: "Imtihonga o'tish" }).click();
  await expect(page).toHaveURL(/\/uz\/dashboard\/exams\/\d+$/);
  return page.getByRole("region", { name: "Test", exact: true });
}

test.describe("Oylik imtihon", () => {
  test("o'quvchi testni natijasiz ishlaydi va topshiriq yuboradi", async ({ page }) => {
    await login(page);
    const part = await openExam(page);
    await expect(part).toContainText("5 ta savol · 30 daqiqa");
    await expectAccessible(page, "imtihon: boshlashdan oldin");

    page.once("dialog", (dialog) => void dialog.accept());
    await part.getByRole("button", { name: "Testni boshlash" }).click();
    await expect(part.getByText(/5 tadan 1-savol · javob berilgan: 0/)).toBeVisible();
    await expect(part.locator(".exam-timer time")).toHaveText(/^(29|30):\d\d$/);

    // Birinchi savol keyinga qoldiriladi — oxirida o'zi qaytib keladi.
    const first = await part.locator(".quiz-question").textContent();
    await part.getByRole("button", { name: "Keyinroq" }).click();
    await expect(part.getByText(/5 tadan 2-savol/)).toBeVisible();

    for (let step = 0; step < 5; step++) {
      await answer(part);
      await save(part);
      if (step === 0) await expectAccessible(page, "imtihon: javob saqlangach");
      const next = part.getByRole("button", { name: /^(Keyingi savol|Natijani ko'rish)$/ });
      const label = await next.textContent();
      await next.click();
      if (label?.includes("Natijani")) break;
      if (step === 3) await expect(part.locator(".quiz-question")).toHaveText(first ?? "");
    }

    // Test yakunlandi: foiz bor, to'g'ri javoblar esa imtihon yopilgach.
    await expect(part.getByText("Test qismi yakunlandi")).toBeVisible();
    await expect(part.locator(".exam-score__value")).toHaveText("100%");
    await expect(part).toContainText("To'g'ri javoblar imtihon yopilgach");

    // Amaliy topshiriq: izoh bilan javob → "Baholanmoqda".
    const tasks = page.getByRole("region", { name: /Amaliy topshiriqlar/ });
    const task = tasks.getByRole("listitem").filter({ hasText: TASK });
    await task.getByLabel("Izoh").fill("Portfolio tayyor: https://github.com/sinov/portfolio");
    await task.getByRole("button", { name: "Yuborish" }).click();
    await expect(task.locator(".exam-chip")).toHaveText("Baholanmoqda");
    await expect(tasks.getByRole("heading", { level: 2 })).toHaveText("Amaliy topshiriqlar · 1/2");
    await expectAccessible(page, "imtihon: test va topshiriqdan keyin");
  });

  test("o'qituvchi amaliy javobni baholaydi", async ({ page }) => {
    await login(page, "uz", ACCOUNTS.teacher);
    await page.goto("/uz/dashboard/teaching");
    const exams = page.getByRole("region", { name: "Oylik imtihonlar" });
    await expect(exams).toContainText("Baholash: 1");
    await exams.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/uz\/dashboard\/teaching\/exams\/\d+$/);
    await expect(page.getByRole("rowheader", { name: /Sinov/ })).toBeVisible();
    await expectAccessible(page, "imtihon: o'qituvchi jadvali");

    // Birinchi baholanmagan javob o'zi ochiladi.
    await expect(page.getByRole("heading", { name: TASK })).toBeVisible();
    await expect(page.getByText("Portfolio tayyor")).toBeVisible();
    await page.getByLabel("Baho (0–100)").fill("90");
    await page.getByLabel("Izoh o'quvchiga").fill("Zo'r, faqat mobil ko'rinishni tekshiring.");
    await page.getByRole("button", { name: "Baholash", exact: true }).last().click();

    await expect(page.getByText(/Hamma javoblar baholangan/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Sinov.*portfolio/ })).toHaveText("90");
  });

  test("o'quvchi bahoni ko'radi", async ({ page }) => {
    await login(page);
    await openExam(page);
    const task = page
      .getByRole("region", { name: /Amaliy topshiriqlar/ })
      .getByRole("listitem")
      .filter({ hasText: TASK });
    await expect(task.locator(".exam-chip")).toHaveText("Baho · 90/100");
    await expect(task).toContainText("Zo'r, faqat mobil ko'rinishni tekshiring.");
    await expect(page.getByRole("region", { name: "Hozircha natija" })).toBeVisible();
  });
});

test.describe("Sertifikat", () => {
  test("ommaviy tekshirish sahifasi va QR @mobile", async ({ page }) => {
    await page.goto(`/uz/verify/${CERTIFICATE.toLowerCase()}`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sertifikat haqiqiy");
    await expect(page.locator(".cert-facts")).toContainText("Sinov O'quvchi");
    await expect(page.locator(".cert-facts")).toContainText(CERTIFICATE);
    await expect(
      page.getByRole("img", { name: "Sertifikatni tekshirish uchun QR kod" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "PDF yuklab olish" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Telegram'da ulashish" })).toHaveAttribute(
      "href",
      /^https:\/\/t\.me\/share\/url\?url=.*verify%2FSE-2601-E2ESNV/,
    );
    await expectAccessible(page, "sertifikat: tekshirish");

    await page.goto("/uz/verify/SE-0000-XXXXXX");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sertifikat topilmadi");
  });

  test("kabinetda sertifikatlar va shartlar", async ({ page }) => {
    await login(page);
    const menu = page.getByRole("navigation", { name: "Kabinet menyusi" });
    await menu.getByRole("link", { name: "Sertifikatlar" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sertifikatlar");
    await expect(page.getByText(CERTIFICATE)).toBeVisible();
    await expectAccessible(page, "sertifikatlar: kabinet");

    await page.locator(".cert-card").first().getByRole("link").click();
    await expect(page).toHaveURL(new RegExp(`/verify/${CERTIFICATE}$`));
  });
});
