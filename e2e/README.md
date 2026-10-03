# E2E testlar (Playwright)

Butun stack ishlab turganda brauzerda asosiy yo'llarni tekshiradi:

| Fayl                    | Nima                                                                                                                                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `site.spec.ts`          | Landing 3 tilda (CSP nonce bilan), katalog filtri, kurs sahifasi, haqiqiy 404, kabinet himoyasi                                                                                                      |
| `purchase.spec.ts`      | Kirish → kursni sotib olish → Click to'lovi (taqlid) → kurs ochiladi (premium) → dars; to'lanmagan dars 403                                                                                          |
| `dashboard.spec.ts`     | Katalog kabinet ichida (menyu bilan), kabinetdagi 404, SIFAT Kids ko'rinishini yoqish/o'chirish                                                                                                      |
| `smoke.spec.ts`         | Auth sahifalari, kabinet sahifalari, huquqiy sahifa va 404                                                                                                                                           |
| `assistant.spec.ts`     | AI maslahatchi (test rejimida): kasb testi yonidagi chat, kurs kartochkalari, ariza; suzuvchi oyna va klaviatura                                                                                     |
| `teaching.spec.ts`      | O'qituvchi kabineti: guruhlar va o'quvchilar progressi; o'quvchi bu bo'limni ko'rmaydi                                                                                                               |
| `notifications.spec.ts` | Kabinetdagi xabar: menyudagi son, xabar va havola, o'qilgach son yo'qoladi; sozlamalarda aksiyalar roziligi                                                                                          |
| `homework.spec.ts`      | Uy vazifasi: o'quvchi izoh, kod va rasm bilan javob yuboradi → o'qituvchi navbatdan ochib baho qo'yadi → o'quvchi natijani ko'radi; axe                                                              |
| `quiz.spec.ts`          | Dars testi: 5 turdagi savol (bitta ataylab xato) → faqat to'g'ri/noto'g'ri, 80%, 2 yulduz, dars tugatildi, xatolar ustida ishlash (to'g'ri javob va izoh); o'qituvchi natijasi; telefonda davom; axe |
| `live.spec.ts`          | Jonli darslar: bosh sahifada keyingi dars, jadval, "Qo'shilish" (Meet'ga yo'naltirish), o'tgan dars yozuvi; o'qituvchi davomat va "Dars o'tildi"; o'quvchi holati va xabari; telefonda davomat; axe  |
| `gating.spec.ts`        | Onlayn o'quvchi: testdan o'tmaguncha keyingi dars yopiq — tushuntirish va testli darsga havola; do'st taklifi `?ref=` cookie'da; axe                                                                 |
| `exam.spec.ts`          | Oylik imtihon: kabinetdagi eslatma → test (natijasiz, taymer, savolni keyinga qoldirish) → 100% → amaliy topshiriq → o'qituvchi baholaydi → o'quvchi bahoni ko'radi; sertifikat: ommaviy tekshirish sahifasi (QR, ulashish, topilmagan raqam), kabinetdagi sertifikatlar; axe |
| `rewards.spec.ts`       | XP va coin: bosh sahifadagi karta, Yutuqlar (balans, bugungi topshiriqlar, tarix, shtraf, taklif havolasi, qoidalar), reyting (kurs, davr, o'z o'rni), "reytingda ko'rsatilmasin", o'qituvchi shtrafni sabab bilan bekor qiladi, taklif bilan kelgan do'stga to'lovda chegirma; axe |
| `shop.spec.ts`          | Coin do'koni: coin yetmagan sovg'a tugmasi o'chiq, sovg'a olinadi (tasdiqlash, balans va zaxira kamayadi), Buyurtmalarim — "Yangi"; axe |

Har bir sahifada **axe-core** (WCAG 2.1 A/AA — jiddiy va kritik xatolar bo'lmasligi kerak) va
**konsol/CSP** tekshiruvi ishlaydi.

## Ishga tushirish

```bash
# 1. Test ma'lumotlari (faqat DEBUG rejimida ishlaydi)
docker compose exec backend python manage.py seed_e2e
# AI chat testlari: worker-ai ishlab turishi kerak. Backend haqiqiy Gemini bilan ishlasa
# (ASSISTANT_DRY_RUN=false va kalit bor), E2E_AI_LIVE=1 bering — suhbat testi o'tkazib yuboriladi.

# 2. Testlar (frontend papkasida)
npx playwright install chromium     # birinchi marta
npx playwright test -c e2e/playwright.config.ts
```

O'rnatilgan Chrome bilan: `E2E_CHANNEL=chrome npx playwright test -c e2e/playwright.config.ts`.

## Muhit o'zgaruvchilari

| O'zgaruvchi            | Standart                | Izoh                                                                   |
| ---------------------- | ----------------------- | ---------------------------------------------------------------------- |
| `E2E_BASE_URL`         | `http://localhost`      | Sayt manzili                                                           |
| `E2E_USER_PASSWORD`    | `E2e-sinov-parol-2026`  | `seed_e2e` yaratgan test o'quvchisining paroli (backend bilan bir xil) |
| `E2E_ONLINE_PASSWORD`  | `E2e-onlayn-parol-2026` | Onlayn test o'quvchisi (`+998900007777`) paroli                        |
| `E2E_CLICK_SERVICE_ID` | `11111`                 | Backend'dagi `CLICK_SERVICE_ID`                                        |
| `E2E_CLICK_SECRET`     | `local-test-secret`     | Backend'dagi `CLICK_SECRET_KEY` — faqat test muhitining kaliti         |

Test o'quvchisi: `+998 90 000 99 99`. U faqat `DEBUG=true` bo'lganda yaratiladi.
