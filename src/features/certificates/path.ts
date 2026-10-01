/**
 * Sertifikatdagi "yo'l": bog'langan nuqtalar — o'quvchi bosib o'tgan darslar ramzi. Shakli
 * sertifikat raqamidan hisoblanadi: har bir sertifikatda o'ziga xos, lekin qayta ochilganda
 * (va chop etilganda) bir xil. Pastdan boshlanib, yuqorida — brend kursorida tugaydi.
 */

export type Point = { x: number; y: number };

/** FNV-1a: satr → 32 bitli son. */
function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

/** mulberry32: urug'dan takrorlanadigan tasodifiy sonlar (0..1). */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

/** `count` ta nuqta, koordinatalar 0..1 oralig'ida (chizishda o'lchamga ko'paytiriladi). */
export function journey(seed: string, count = 9): Point[] {
  const next = random(hash(seed));
  return Array.from({ length: count }, (_, index) => {
    const progress = count === 1 ? 1 : index / (count - 1);
    const trend = 0.82 - progress * 0.64;
    const jitter = index === 0 || index === count - 1 ? 0 : (next() - 0.5) * 0.36;
    const y = Math.min(0.92, Math.max(0.08, trend + jitter));
    return { x: 0.03 + progress * 0.94, y: Number(y.toFixed(4)) };
  });
}
