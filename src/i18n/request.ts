import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    // O'quvchilar O'zbekistonda: sanalar serverda ham, brauzerda ham Toshkent vaqtida
    // (aks holda server UTC'da, brauzer mahalliy vaqtda yozib, gidratsiya farq qiladi).
    timeZone: "Asia/Tashkent",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
