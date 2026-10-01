export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/** Brauzer paneli rangi (`<meta name="theme-color">`) — sahifa foniga teng. */
export const THEME_COLORS: Record<Theme, string> = { light: "#f6f7fc", dark: "#0b0d1a" };

/**
 * `<head>`'da HTML o'qilayotganda, birinchi chizishdan oldin ishlaydi: saqlangan yoki tizim
 * temasini qo'yadi. `js` klassi animatsiyalarga ruxsat beradi (JS bo'lmasa mazmun darhol ko'rinadi).
 */
export const THEME_SCRIPT = `(function(){var d=document.documentElement,t;try{t=localStorage.getItem("${THEME_STORAGE_KEY}")}catch(e){}if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.classList.add(t,"js");d.style.colorScheme=t})()`;

export function readTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Maxfiy rejimda localStorage yopiq bo'lishi mumkin: tema faqat shu sahifada qoladi.
  }
}

export function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
  // Tizim temasi uchun ikkala meta ham bor: qo'lda tanlanganda ikkalasi ham shu rangga o'tadi.
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = THEME_COLORS[theme];
  });
}
