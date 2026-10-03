import { expect, expectAccessible, test } from "./fixtures";

/**
 * AI maslahatchi test rejimida (`ASSISTANT_DRY_RUN=true`) yoki Gemini'siz zaxira rejimida: butun yo'l
 * ishlaydi — xabar navbatga tushadi, worker-ai javob beradi, kurs kartochkalari va ariza.
 * Backend haqiqiy Gemini bilan ishlayotgan bo'lsa (`E2E_AI_LIVE=1`), suhbat testi o'tkazib
 * yuboriladi: javob har safar boshqacha va har yurish pul sarflaydi.
 */
test.describe("AI maslahatchi", () => {
  test("kasb testi yonidagi chat: kurslar va ariza", async ({ page }) => {
    test.skip(process.env.E2E_AI_LIVE === "1", "backend haqiqiy Gemini bilan ishlayapti");
    await page.goto("/uz");
    const chat = page.getByRole("region", { name: "AI maslahatchi" });
    await chat.scrollIntoViewIfNeeded();
    await expect(chat).toBeVisible();

    await chat.getByRole("button", { name: "Qaysi kurs menga mos?" }).click();
    const log = chat.getByRole("log");
    // Javob ostida kurs kartochkasi — kurs sahifasiga havola.
    await expect(log.locator("a.chat-card").first()).toHaveAttribute("href", /\/uz\/courses\//);

    await chat.getByLabel("Savolingizni yozing…").fill("Ismim Sinov, raqamim 90 000 99 99");
    await chat.getByRole("button", { name: "Yuborish" }).click();
    await expect(chat.getByText("Arizangiz menejerlarga yuborildi")).toBeVisible();
    await expect(log.getByText(/Arizangiz qabul qilindi/).first()).toBeVisible();
    await expectAccessible(page, "AI chat (kasb testi yonida)");

    // Keyingi testlar toza suhbatdan boshlasin.
    await chat.getByRole("button", { name: "Yangi suhbat" }).click();
    await expect(chat.getByRole("button", { name: "Qaysi kurs menga mos?" })).toBeVisible();
  });

  test("boshqa sahifalarda suzuvchi oyna", async ({ page }) => {
    await page.goto("/uz/courses");
    const launcher = page.getByRole("button", { name: "AI maslahatchini ochish" });
    await launcher.click();

    const dialog = page.getByRole("dialog", { name: "AI maslahatchi" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Savolingizni yozing…")).toBeFocused();
    await expectAccessible(page, "AI chat oynasi");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(launcher).toBeFocused();
  });
});
