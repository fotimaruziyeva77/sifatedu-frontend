import AxeBuilder from "@axe-core/playwright";
import { test as base, expect, type Page } from "@playwright/test";

/** Dev server'ning o'z shovqini: sahifa xatosi emas. */
const IGNORED_CONSOLE = [/_next\/hmr/, /webpack-hmr/, /Download the React DevTools/];
/**
 * Uchinchi tomon: Google kirish tugmasi o'z uslubini XHR bilan so'raydi va Google localhost
 * uchun CORS sarlavhasini qaytarmaydi; uning iframe'i esa ba'zan Google'ning o'z report-only
 * CSP ogohlantirishini yozadi ("Framing 'https://accounts.google.com/'..."). Bu bizning kodimiz
 * emas va tugma baribir chiqadi.
 */
const THIRD_PARTY = /accounts\.google\.com\/(gsi\/|')/;

type Watch = {
  /** CSP buzilishlari va brauzer konsolidagi xatolar. Test oxirida bo'sh bo'lishi kerak. */
  problems: string[];
};

/**
 * Har bir testda: konsol xatolari, sahifadagi istisnolar va CSP buzilishlari yig'iladi.
 * Test tugagach ular bo'lmasligi tekshiriladi — sahifa "ko'rinadi, lekin ichida buzilgan"
 * holatlar ham ushlanadi.
 */
export const test = base.extend<Watch>({
  problems: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        const text = message.text();
        if (IGNORED_CONSOLE.some((pattern) => pattern.test(text))) return;
        if (THIRD_PARTY.test(text) || THIRD_PARTY.test(message.location().url)) return;
        problems.push(`console: ${text.slice(0, 300)}`);
      });
      page.on("pageerror", (error) => problems.push(`pageerror: ${error.message.slice(0, 300)}`));

      await use(problems);

      expect(problems, "konsol xatolari yoki CSP buzilishi").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** WCAG 2.1 A/AA bo'yicha jiddiy va kritik xatolar bo'lmasligi kerak (TZ: B1 dan avtomatik). */
export async function expectAccessible(page: Page, name: string): Promise<void> {
  // Skan paytida `prefers-reduced-motion`: sayt bu rejimda "paydo bo'lish" effektlarisiz,
  // hamma kontentni darhol ko'rsatadi. Aks holda axe ekrandan pastdagi matnni ko'rmaydi,
  // animatsiya o'rtasidagini esa yarim shaffof holda o'lchaydi.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    // 3D sahna — dekorativ canvas, ekran o'quvchi uchun muqobil matn sahifada bor.
    .exclude("canvas")
    .analyze();
  const serious = result.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.help} — ${violation.nodes
          .slice(0, 3)
          .map((node) => node.target.join(" "))
          .join(", ")}`,
    );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect(serious, `${name}: accessibility xatolari`).toEqual([]);
}

/** `seed_e2e` yaratgan akkauntlar (parollar — faqat local va CI uchun). */
export const ACCOUNTS = {
  student: {
    phone: "900009999",
    password: process.env.E2E_USER_PASSWORD ?? "E2e-sinov-parol-2026",
  },
  teacher: {
    phone: "900008888",
    password: process.env.E2E_TEACHER_PASSWORD ?? "E2e-ustoz-parol-2026",
  },
  /** Onlayn, guruhsiz: keyingi dars oldingi darsning testidan o'tilgach ochiladi. */
  online: {
    phone: "900007777",
    password: process.env.E2E_ONLINE_PASSWORD ?? "E2e-onlayn-parol-2026",
  },
} as const;

/** Kirish sahifasi orqali (standart — test o'quvchisi). */
export async function login(
  page: Page,
  locale = "uz",
  account: { phone: string; password: string } = ACCOUNTS.student,
): Promise<void> {
  await page.goto(`/${locale}/auth/login`);
  await page.getByLabel(/telefon|телефон|phone/i).fill(account.phone);
  await page.getByLabel(/^(parol|пароль|password)$/i).fill(account.password);
  await page.getByRole("button", { name: /^(kirish|войти|log in|sign in)$/i }).click();
  await page.waitForURL(/\/dashboard/);
}
