import { encode } from "uqr";

/**
 * QR kod SVG uchun: ma'lumot modullari — nuqtalar ("nuqtalarni bog'lang" motivi), burchakdagi
 * uchta ko'z — alohida chiziladi. Xato tuzatish "Q" (25%): nuqtali ko'rinishda ham ishonchli
 * o'qiladi.
 */
export type QrShape = {
  size: number;
  /** Barcha nuqtalar bitta `path` da. */
  dots: string;
  /** Ko'zlarning chap-yuqori burchagi (7×7 modul). */
  eyes: Array<{ x: number; y: number }>;
};

const POSITION = 2; // uqr: QrCodeDataType.Position
const RADIUS = 0.42;

export function qrShape(text: string): QrShape {
  const qr = encode(text, { ecc: "Q", border: 0 });
  const parts: string[] = [];
  qr.data.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (!dark || qr.types[y]?.[x] === POSITION) return;
      const left = (x + 0.5 - RADIUS).toFixed(2);
      const top = (y + 0.5).toFixed(2);
      const width = (RADIUS * 2).toFixed(2);
      parts.push(
        `M${left} ${top}a${RADIUS} ${RADIUS} 0 1 0 ${width} 0a${RADIUS} ${RADIUS} 0 1 0 -${width} 0`,
      );
    });
  });
  const far = qr.size - 7;
  return {
    size: qr.size,
    dots: parts.join(""),
    eyes: [
      { x: 0, y: 0 },
      { x: far, y: 0 },
      { x: 0, y: far },
    ],
  };
}
