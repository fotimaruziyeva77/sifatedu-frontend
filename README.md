# Sifat Edu — frontend

Next.js 16 (App Router) + Tailwind CSS v4 + next-intl. 3 til: o'zbek (asosiy), rus, ingliz. URL'lar `/uz/...`, `/ru/...`, `/en/...`.

**Repozitoriy:** bu — `sifatedu-frontend`. Butun stack (backend, nginx, Docker Compose, hujjatlar)
`sifatedu-backend` repozitoriyida; frontend uning ichiga `frontend/` bo'lib klonlanadi:

```bash
git clone https://github.com/fotimaruziyeva77/sifatedu-backend.git sifatedu
cd sifatedu
git clone https://github.com/fotimaruziyeva77/sifatedu-frontend.git frontend
docker compose up --build
```

CI: `.github/workflows/frontend.yml` (eslint, tsc, vitest, build). E2E testlar (`e2e/`) butun stack
bilan backend repodagi `e2e.yml` orqali ishlaydi.

## Tuzilma

```
messages/{uz,ru,en}.json   # interfeys matnlari
src/
  app/[locale]/(site)/     # landing, katalog (/courses), kurs sahifasi, huquqiy sahifalar, 404
  app/[locale]/(auth)/     # kirish, ro'yxatdan o'tish, parolni tiklash, telefon qadami
  app/[locale]/(app)/      # kabinet: dashboard va sozlamalar
  app/healthz/             # Docker healthcheck
  components/brand/        # logo: SVG yo'llari 3D sahna bilan umumiy
  components/site/         # header, footer, til almashtirgich, 2D tarmoq, global o'zaro ta'sirlar
  components/theme/        # kun/tun: tema script'i, useTheme, tugma
  components/three/        # 3D hero: ko'nikmalar turkumi va nuqtali logo posteri
  components/ui/           # shadcn/ui
  features/landing/        # landing bo'limlari, kasb testi, motion-rolik
  features/leads/          # ariza formasi
  features/auth/           # kirish formalari, Google/Telegram tugmalari, profil
  features/catalog/        # kurs kartasi, filtrlar, dastur, sahifalash
  features/legal/          # oferta, maxfiylik, qaytarish sahifalari
  fonts/                   # shriftlar (loyiha ichida, SIL OFL)
  i18n/                    # routing, navigation, hreflang
  lib/                     # API client, formatlash, telefon maskasi
  proxy.ts                 # til bo'yicha yo'naltirish (Next 16 da middleware o'rniga)
```

## Dizayn

Konsepsiya — **"Nuqtalarni bog'lang"**: logo nuqtalardan yig'iladi, kursor yurgan joyda nuqtalar ulanadi, o'qish yo'li scroll bilan chiziladi. To'liq tokenlar: `docs/PLAN.md`, 4-bo'lim.

- **Tema:** kun (`:root`) va tun (`.dark`), `src/app/globals.css`. Tema `<head>`'dagi script bilan birinchi chizishdan oldin qo'yiladi (`components/theme/theme.ts`), tugma yangi temani doira bo'lib ochadi (View Transitions).
- **Ranglar:** brend qizili `--caret`, tarmoq chiziqlari `--line`, yo'nalish ranglari `--track-frontend|backend|design|basics` (faqat bezak uchun).
- **Shriftlar:** Geologica (sarlavhalar, ajratilgan so'zda `CRSV` o'qi), Onest (matn), Martian Mono (raqamlar, teglar). Fayllar `src/fonts/`'da: Google Fonts'dan build paytida yuklash sekin tarmoqda uzilib qolardi. Har shrift lotin + kirill qismiga bo'lingan, oldindan faqat lotin qismi yuklanadi.
- **Sarlavhada `*so'z*`:** ajratib ko'rsatiladi (`features/landing/emphasis.tsx`). Admin hero sarlavhasida ham shu belgidan foydalanadi.

## Animatsiyalar

Animatsiya kutubxonasi yo'q: bitta client komponent (`components/site/interactions.tsx`) `data-*` atributlari orqali ishlaydi, bo'limlar server komponent bo'lib qoladi.

| Atribut          | Nima qiladi                                                              |
| ---------------- | ------------------------------------------------------------------------ |
| `data-reveal`    | Ekranga kirganda paydo bo'ladi (bir marta). JS bo'lmasa darhol ko'rinadi |
| `data-play`      | Ekrandan chiqqanda ichidagi CSS animatsiyalari to'xtaydi                 |
| `data-spotlight` | Kursor ostida yumshoq yorug'lik (`--mx`, `--my`, rang `--spot`)          |
| `data-magnetic`  | Tugma kursorga biroz tortiladi                                           |

Barcha animatsiyalar `prefers-reduced-motion`'ni hurmat qiladi.

## 3D hero

- SIFAT logosi konturlari bo'ylab nuqtalardan chiziladi, keyin ko'nikmalar turkumiga aylanadi (kirish animatsiyasi sessiyada bir marta). Kursor yaqinidagi tugunlar unga tortiladi va qizil chiziqlar bilan ulanadi; kursor bo'lmasa "arvoh kursor" o'zi aylanadi.
- Sahna faqat brauzerda, sahifa yuklangandan keyin (`requestIdleCallback`) yuklanadi. Shu paytgacha va 3D ishlamasa nuqtali logo posteri (SVG, SSR) ko'rinadi.
- Qurilma darajasi: kuchli qurilmada 150 tugun va 14 ko'nikma, telefon yoki kuchsiz qurilmada 84 tugun va 10 ko'nikma.
- `prefers-reduced-motion`, trafik tejash rejimi yoki WebGL yo'q bo'lsa, 3D umuman yuklanmaydi.
- Hero ekrandan chiqsa, render to'xtaydi. FPS tushib ketsa yoki WebGL konteksti yo'qolsa, posterga qaytadi.

## Kirish va kabinet

Sahifalar uch guruhga bo'lingan (`route groups`), har birining o'z layout'i bor:

| Guruh    | Layout                                                                   |
| -------- | ------------------------------------------------------------------------ |
| `(site)` | Header + footer; landing va huquqiy sahifalar                            |
| `(auth)` | Faqat logo va orqaga havola — diqqat formada                             |
| `(app)`  | Kabinet header'i; `getMe()` bo'sh bo'lsa, kirish sahifasiga yo'naltiradi |

- Foydalanuvchi **serverda** olinadi (`lib/api/me.ts`), shuning uchun header miltillamaydi.
- `proxy.ts` `/dashboard` uchun session cookie borligini tekshiradi (tez tekshiruv);
  haqiqiy tekshiruv baribir serverda.
- Brauzer so'rovlari `lib/api/client.ts` orqali: CSRF tokeni avtomatik qo'shiladi (cookie
  bo'lmasa, avval `/auth/csrf/` chaqiriladi) va joriy til `Accept-Language` sifatida yuboriladi —
  SMS matni shu tilda keladi.

## Katalog

- `/courses` — filtrlar va qidiruv holati URL'da (`?category=frontend&level=BEGINNER&q=...`):
  havolani ulashish mumkin, orqaga tugmasi ishlaydi, kartalar server komponenti bo'lib qoladi.
- Qidiruv yozish tugagach yuboriladi (400 ms), filtr o'zgarganda sahifalash boshiga qaytadi.
- `/courses/[slug]` — kurs sahifasi: dastur akkordeoni (bepul darslar belgilangan), narx paneli,
  ustozlar va ariza formasi. "Yozilish" tugmasi shu sahifadagi formada kursni tanlaydi;
  to'lov 5-qadamda ulanadi.

## Backend bilan ishlash

- Brauzer backend'ga bir xil domen orqali murojaat qiladi (`/api/...`, nginx yo'naltiradi).
- Server Components backend'ga Docker tarmog'i ichida `API_INTERNAL_URL` orqali murojaat qiladi.
- API tiplari backend'ning OpenAPI sxemasidan generatsiya qilinadi:

  ```bash
  docker compose exec frontend npm run gen:api
  ```

## Ishga tushirish

Root papkadan `docker compose up --build` (qarang: [../README.md](../README.md)). `node_modules` konteyner volume'ida turadi.

Local rejimda `next dev --webpack` + `WATCHPACK_POLLING` ishlatiladi: Windows'dagi Docker volume fayl o'zgarishi haqida xabar bermaydi, Turbopack'ning polling'i esa bu muhitda ishlamadi. Production build (`npm run build`) Turbopack bilan yig'iladi.

## Buyruqlar

```bash
docker compose exec frontend npm run lint
docker compose exec frontend npm run typecheck
docker compose exec frontend npm run format
```

## Docker image target'lari

| Target    | Nima uchun                                                                         |
| --------- | ---------------------------------------------------------------------------------- |
| `dev`     | Local: `next dev`, kod volume orqali                                               |
| `runtime` | Production: `output: "standalone"`, `node server.js`, root bo'lmagan foydalanuvchi |
