/**
 * Markazning asosiy rangi → CSS tokenlari. Rang istalgancha bo'lishi mumkin, matn esa o'qilishi
 * shart: tugma matni oq yoki qora tanlanadi, kichik rangli matn fon bilan 4.5:1 ga yetguncha
 * to'qlashtiriladi yoki ochiladi (WCAG AA).
 */

type Rgb = readonly [number, number, number];

const HEX = /^#[0-9a-f]{6}$/i;
const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [18, 20, 39];
// `--background` qiymatlari (globals.css).
const LIGHT_PAGE: Rgb = [0xf6, 0xf7, 0xfc];
const DARK_PAGE: Rgb = [0x0b, 0x0d, 0x1a];
const TEXT_CONTRAST = 4.5;
const GRAPHIC_CONTRAST = 3;
const STEP = 0.05;

function parse(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHex(color: Rgb): string {
  return `#${color.map((part) => Math.round(part).toString(16).padStart(2, "0")).join("")}`;
}

function channel(value: number): number {
  const part = value / 255;
  return part <= 0.03928 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(parse(a)), luminance(parse(b))].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

function mix(color: Rgb, target: Rgb, amount: number): Rgb {
  return [0, 1, 2].map((i) => color[i] + (target[i] - color[i]) * amount) as unknown as Rgb;
}

/** Rangni `toward` tomonga suradi, fon bilan kerakli kontrastga yetganda to'xtaydi. */
function adjust(color: Rgb, page: Rgb, toward: Rgb, wanted: number): string {
  for (let amount = 0; amount < 1; amount += STEP) {
    const candidate = toHex(mix(color, toward, amount));
    if (contrast(candidate, toHex(page)) >= wanted) return candidate;
  }
  return toHex(toward);
}

/** `#rrggbb` emas bo'lsa — bo'sh qator: sayt standart ranglarda qoladi. */
export function brandCss(hex: string): string {
  if (!HEX.test(hex)) return "";
  const color = parse(hex);
  const onColor = contrast(hex, toHex(WHITE)) >= contrast(hex, toHex(BLACK)) ? WHITE : BLACK;
  const caretDark = adjust(color, DARK_PAGE, WHITE, GRAPHIC_CONTRAST);
  // `html` qo'shilgan: Next uslub fayllari qaysi tartibda kelsa ham shu qiymatlar ustun turadi.
  return (
    `html:root{--primary:${hex};--primary-foreground:${toHex(onColor)};--ring:${hex};` +
    `--caret:${hex};--caret-text:${adjust(color, LIGHT_PAGE, BLACK, TEXT_CONTRAST)}}` +
    `html.dark{--caret:${caretDark};--caret-text:${adjust(color, DARK_PAGE, WHITE, TEXT_CONTRAST)}}`
  );
}
