/** O'zbekiston raqami: "+998 90 123 45 67" ko'rinishida yoziladi, backend'ga shu holicha yuboriladi. */

const PREFIX = "998";
const LOCAL_LENGTH = 9;

function localDigits(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith(PREFIX)) {
    digits = digits.slice(PREFIX.length);
  }
  return digits.slice(0, LOCAL_LENGTH);
}

/** Yozish paytida maska: "901234567" → "+998 90 123 45 67". */
export function formatPhoneInput(value: string): string {
  const digits = localDigits(value);
  const groups = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)];
  return ["+998", ...groups.filter(Boolean)].join(" ");
}

export function isCompletePhone(value: string): boolean {
  return localDigits(value).length === LOCAL_LENGTH;
}
