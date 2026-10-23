import localFont from "next/font/local";

/**
 * Dars slaydlari shriftlari (brend taqdimotlaridagidek): sarlavha — Rubik, matn — Inter,
 * kod — JetBrains Mono. Faqat slayd ichida ishlatiladi: sinflar slayd elementiga qo'yiladi,
 * fayllar oldindan yuklanmaydi. Lotin va kirill qismlari — `index.ts` dagi kabi.
 */
// next/font qiymatlari literal bo'lishi shart: unicode-range har chaqiruvda qayta yozilgan.
const rubik = localFont({
  src: "./rubik-latin.woff2",
  weight: "300 900",
  variable: "--font-rubik",
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

const rubikCyrillic = localFont({
  src: "./rubik-cyrillic.woff2",
  weight: "300 900",
  variable: "--font-rubik-cyrillic",
  display: "swap",
  preload: false,
  declarations: [
    { prop: "unicode-range", value: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116" },
  ],
});

const inter = localFont({
  src: "./inter-latin.woff2",
  weight: "100 900",
  variable: "--font-inter",
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

const interCyrillic = localFont({
  src: "./inter-cyrillic.woff2",
  weight: "100 900",
  variable: "--font-inter-cyrillic",
  display: "swap",
  preload: false,
  declarations: [
    { prop: "unicode-range", value: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116" },
  ],
});

const jetbrains = localFont({
  src: "./jetbrains-mono-latin.woff2",
  weight: "100 800",
  variable: "--font-jetbrains",
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

const jetbrainsCyrillic = localFont({
  src: "./jetbrains-mono-cyrillic.woff2",
  weight: "100 800",
  variable: "--font-jetbrains-cyrillic",
  display: "swap",
  preload: false,
  declarations: [
    { prop: "unicode-range", value: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116" },
  ],
});

/** Slayd elementi klassi: slayd shriftlarining CSS o'zgaruvchilari. */
export const slideFonts = [rubik, rubikCyrillic, inter, interCyrillic, jetbrains, jetbrainsCyrillic]
  .map((font) => font.variable)
  .join(" ");
