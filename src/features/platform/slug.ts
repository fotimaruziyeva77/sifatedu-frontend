/** Markaz manzili (subdomen): backend'dagi qoidalar bilan bir xil (`apps/tenancy/signup.py`). */

export const SLUG_PATTERN = /^[a-z](?!.*--)[a-z0-9-]{1,28}[a-z0-9]$/;
const MAX_LENGTH = 30;

const CYRILLIC: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  ғ: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "j",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  қ: "q",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ў: "o",
  ф: "f",
  х: "x",
  ҳ: "h",
  ц: "s",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ы: "i",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

/** Markaz nomidan manzil taklifi: «Najot Ta'lim» → `najot-talim`. */
export function suggestSlug(name: string): string {
  const latin = [...name.toLowerCase()].map((char) => CYRILLIC[char] ?? char).join("");
  return latin
    .replace(/['ʻʼ‘’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^[-0-9]+/, "")
    .slice(0, MAX_LENGTH)
    .replace(/-+$/, "");
}
