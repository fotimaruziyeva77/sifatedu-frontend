import { createHash } from "node:crypto";

import type { APIRequestContext } from "@playwright/test";

import { expect, expectAccessible, login, test } from "./fixtures";

/**
 * Asosiy yo'l (TZ 14.1): kirish → kurs sotib olish → to'lov → kurs ochiladi → dars.
 *
 * Click sahifasining o'rniga test to'lov tizimi rolini o'ynaydi: backend'ga Prepare va
 * Complete so'rovlarini xuddi Click kabi imzolab yuboradi (kalit — `E2E_CLICK_SECRET`).
 */
const COURSE = "praktikum-backend";
const SERVICE_ID = process.env.E2E_CLICK_SERVICE_ID ?? "11111";
const SECRET = process.env.E2E_CLICK_SECRET ?? "local-test-secret";

const md5 = (parts: string[]) => createHash("md5").update(parts.join("")).digest("hex");

async function payLikeClick(request: APIRequestContext, orderId: string, amount: string) {
  const clickTransId = `e2e${Date.now()}`;
  const signTime = "2026-09-27 12:00:00";
  const common = {
    click_trans_id: clickTransId,
    service_id: SERVICE_ID,
    click_paydoc_id: "1",
    merchant_trans_id: orderId,
    amount,
    error: "0",
    error_note: "Success",
    sign_time: signTime,
  };

  const prepared = await request.post("/api/v1/payments/click/prepare/", {
    data: {
      ...common,
      action: "0",
      sign_string: md5([clickTransId, SERVICE_ID, SECRET, orderId, amount, "0", signTime]),
    },
  });
  const prepareBody = await prepared.json();
  expect(prepareBody.error, JSON.stringify(prepareBody)).toBe(0);

  const prepareId = String(prepareBody.merchant_prepare_id);
  const completed = await request.post("/api/v1/payments/click/complete/", {
    data: {
      ...common,
      action: "1",
      merchant_prepare_id: prepareId,
      sign_string: md5([
        clickTransId,
        SERVICE_ID,
        SECRET,
        orderId,
        prepareId,
        amount,
        "1",
        signTime,
      ]),
    },
  });
  const completeBody = await completed.json();
  expect(completeBody.error, JSON.stringify(completeBody)).toBe(0);
}

test("kurs sotib olinadi va ochiladi", async ({ page, request }) => {
  await login(page);

  await page.goto(`/uz/courses/${COURSE}`);
  // Offlayn, 2 oy: jami summa sahifada ko'rinadi, lekin buyurtmada serverniki ishlatiladi.
  await page.getByRole("radio", { name: /Offlayn/ }).check();
  await page.getByRole("button", { name: "Bir oy qo'shish" }).click();
  await expect(page.locator("output")).toHaveText("2");

  // Click sahifasi o'rniga tutib qolamiz: u yerga qanday havola bilan yuborilganini tekshiramiz.
  let payUrl = "";
  await page.route("https://my.click.uz/**", async (route) => {
    payUrl = route.request().url();
    await route.fulfill({ status: 200, contentType: "text/html", body: "<p>Click</p>" });
  });
  await page.getByRole("button", { name: "Sotib olish" }).click();
  await page.waitForURL(/my\.click\.uz\/services\/pay/);
  expect(payUrl).toContain("my.click.uz/services/pay");

  const params = new URL(payUrl).searchParams;
  const orderId = params.get("transaction_param") ?? "";
  const amount = params.get("amount") ?? "";
  expect(orderId).toMatch(/^\d+$/);
  // Foydalanuvchi to'lovdan keyin o'z tilidagi natija sahifasiga qaytadi.
  expect(params.get("return_url")).toContain(`/uz/payment/result?order=${orderId}`);

  await payLikeClick(request, orderId, `${amount}.00`);

  // Click'dan qaytgach: holat backend'dan olinadi.
  await page.goto(`/uz/payment/result?order=${orderId}`);
  await expect(page.getByRole("heading", { name: "To'lov qabul qilindi" })).toBeVisible();
  await expectAccessible(page, "to'lov natijasi");

  await page.getByRole("link", { name: "Kursni ochish" }).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/courses/${COURSE}$`));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // To'langan kurs — premium; offlayn sotib olingani uchun "Offlayn" va amal qilish muddati.
  await expect(page.locator(".course-head.is-premium")).toBeVisible();
  await expect(page.locator(".course-head__chip")).toHaveText("Offlayn");
  await expect(page.getByText(/Amal qiladi/)).toBeVisible();
  await expectAccessible(page, "kurs dasturi");

  // Birinchi dars ochiladi (videosi bo'lmasa ham sahifa ishlaydi).
  await page.locator("a.lesson-row").first().click();
  await expect(page).toHaveURL(/\/lessons\/\d+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectAccessible(page, "dars sahifasi");

  // To'lovlar tarixida "To'langan".
  await page.goto("/uz/dashboard/orders");
  await expect(page.getByText("To'langan").first()).toBeVisible();
});

test("to'lanmagan kurs darsi ochilmaydi", async ({ request }) => {
  // Kirmagan foydalanuvchi pullik dars videosini to'g'ridan-to'g'ri so'rasa — 403.
  const course = await (await request.get("/api/v1/courses/backend/")).json();
  const paid = course.modules
    .flatMap((module: { lessons: { id: number; is_preview: boolean }[] }) => module.lessons)
    .find((lesson: { is_preview: boolean }) => !lesson.is_preview);

  for (const path of ["", "hls/master.m3u8", "hls/key"]) {
    const response = await request.get(`/api/v1/lessons/${paid.id}/${path}`);
    expect(response.status(), path || "dars").toBe(403);
  }
});
