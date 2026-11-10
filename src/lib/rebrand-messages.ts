import type { AbstractIntlMessages } from "next-intl";

/**
 * Tarjimalar birinchi markaz nomi bilan yozilgan: boshqa markazda nom almashtiriladi.
 * Natija saqlanadi — har so'rovda minglab satr qayta aylanmasin.
 */

export const FLAGSHIP_NAME = "Sifat Edu";
const FLAGSHIP_KIDS = "SIFAT Kids";
const KIDS = "Kids";
const CACHE_LIMIT = 300;

const results = new Map<string, AbstractIntlMessages>();

function replaceIn(node: AbstractIntlMessages, name: string): AbstractIntlMessages {
  return Object.fromEntries(
    Object.entries(node).map(([key, value]) => [
      key,
      typeof value === "string"
        ? value.replaceAll(FLAGSHIP_NAME, name).replaceAll(FLAGSHIP_KIDS, KIDS)
        : replaceIn(value, name),
    ]),
  );
}

export function rebrandMessages(
  messages: AbstractIntlMessages,
  locale: string,
  name: string,
): AbstractIntlMessages {
  // Tarjima shablonida maxsus belgilar: backend ham ularni nomda qabul qilmaydi.
  const safe = name.replace(/[{}<>]/g, "");
  const key = `${locale}|${safe}`;
  let result = results.get(key);
  if (!result) {
    if (results.size >= CACHE_LIMIT) results.clear();
    result = replaceIn(messages, safe);
    results.set(key, result);
  }
  return result;
}
