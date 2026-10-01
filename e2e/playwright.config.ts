import { defineConfig, devices } from "@playwright/test";

/**
 * E2E: butun stack (nginx → frontend + backend) ishlab turganda.
 *
 *   E2E_BASE_URL   — sayt manzili (standart http://localhost)
 *   E2E_CHANNEL    — o'rnatilgan brauzer (masalan `chrome`); bo'sh bo'lsa Playwright'ning Chromium'i
 *
 * Oldin test ma'lumotlarini tayyorlang: `python manage.py seed_e2e` (e2e/README.md).
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost";
const channel = process.env.E2E_CHANNEL || undefined;

export default defineConfig({
  testDir: ".",
  // Dev server sahifani birinchi marta kompilyatsiya qilganda sekin: vaqt zaxirasi bilan.
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL,
    channel,
    locale: "uz-UZ",
    navigationTimeout: 90_000,
    actionTimeout: 20_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel } },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], channel },
      // Telefonda faqat asosiy sahifalar: to'lov oqimi bitta loyihada yetarli.
      grep: /@mobile/,
    },
  ],
});
