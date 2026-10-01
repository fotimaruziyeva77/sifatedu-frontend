/**
 * "SIFAT" logosining vektor konturlari. Asl rasm (brand/logo-original.jpg) piksellari bo'yicha
 * o'lchangan: harf balandligi 80, chiziq qalinligi 14. Koordinatalar asl rasmdagidek,
 * shuning uchun viewBox = LOGO_VIEWBOX.
 *
 * Hammasi to'ldirilgan kontur (stroke emas): SVG'da ham, 3D extrude'da ham bir xil ishlaydi.
 */

export const LOGO_VIEWBOX = { x: 66, y: 272, width: 528, height: 80 } as const;

/** Qizil chiziq — kod muharririning kursori. */
export const CARET = { x: 66, y: 272, width: 13, height: 80 } as const;

export const LETTER_PATHS = {
  S:
    "M198,272 H108 A22,22 0 0 0 86,294 V297 A22,22 0 0 0 108,319 H183 A8,8 0 0 1 191,327" +
    " V330 A8,8 0 0 1 183,338 H93 V352 H183 A22,22 0 0 0 205,330 V327 A22,22 0 0 0 183,305" +
    " H108 A8,8 0 0 1 100,297 V294 A8,8 0 0 1 108,286 H198 Z",
  I: "M221,272 H235 V352 H221 Z",
  F: "M365,272 H263 A11,11 0 0 0 252,283 V352 H266 V319 H365 V305 H266 V286 H365 Z",
  // Tashqi kontur va qiya "tirqish" (evenodd bilan to'ldiriladi).
  A:
    "M418.6,272 H429.4 L484.8,352 H468.6 L440.5,311.8 L412.4,352 H376" +
    " C369.6,352 368.2,344 370.5,340.7 Z M424.1,288.4 L432.5,300.4 L406.2,338 H389.4 Z",
  T: "M489,272 H594 V286 H548 V352 H534 V286 H489 Z",
} as const;

export type LetterName = keyof typeof LETTER_PATHS;
