import localFont from "next/font/local";

/**
 * Shriftlar loyiha ichida saqlanadi (SIL Open Font License 1.1, qarang: LICENSE.md).
 * Sabab: Google Fonts'dan build paytida yuklash sekin tarmoqda uzilib qoladi.
 *
 * Har bir shrift ikki faylga bo'lingan (Google Fonts'dagidek): lotin va kirill. Brauzer
 * `unicode-range` bo'yicha kerakli faylni oladi — o'zbekcha sahifa kirill faylini yuklamaydi.
 * Lotin qismida fallback o'chiq: aks holda kirill harflari kirill fayliga yetmay, Arial bilan
 * chiqardi. Umumiy fallback (o'lchamlari moslangan Arial) kirill qismida.
 */
// next/font qiymatlari literal bo'lishi shart: unicode-range har chaqiruvda qayta yozilgan.
export const geologica = localFont({
  src: "./geologica-latin.woff2",
  weight: "100 900",
  variable: "--font-geologica",
  display: "swap",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

export const geologicaCyrillic = localFont({
  src: "./geologica-cyrillic.woff2",
  weight: "100 900",
  variable: "--font-geologica-cyrillic",
  display: "swap",
  preload: false,
  declarations: [
    { prop: "unicode-range", value: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116" },
  ],
});

export const onest = localFont({
  src: "./onest-latin.woff2",
  weight: "100 900",
  variable: "--font-onest",
  display: "swap",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

export const onestCyrillic = localFont({
  src: "./onest-cyrillic.woff2",
  weight: "100 900",
  variable: "--font-onest-cyrillic",
  display: "swap",
  preload: false,
  declarations: [
    { prop: "unicode-range", value: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116" },
  ],
});

// Raqamlar, teglar va kod: kichik yozuvlar, oldindan yuklash shart emas.
export const martian = localFont({
  src: "./martian-mono-latin.woff2",
  weight: "100 800",
  variable: "--font-martian",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

export const martianCyrillic = localFont({
  src: "./martian-mono-cyrillic.woff2",
  weight: "100 800",
  variable: "--font-martian-cyrillic",
  display: "swap",
  preload: false,
  declarations: [
    { prop: "unicode-range", value: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116" },
  ],
});

/** `<html>` klassi: barcha shrift CSS o'zgaruvchilari. */
export const fontVariables = [
  geologica,
  geologicaCyrillic,
  onest,
  onestCyrillic,
  martian,
  martianCyrillic,
]
  .map((font) => font.variable)
  .join(" ");
