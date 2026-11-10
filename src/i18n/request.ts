import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { getCenter } from "@/lib/api/center";
import { rebrandMessages } from "@/lib/rebrand-messages";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const [{ default: messages }, center] = await Promise.all([
    import(`../../messages/${locale}.json`),
    getCenter(),
  ]);

  return {
    locale,
    // O'quvchilar O'zbekistonda: sanalar serverda ham, brauzerda ham Toshkent vaqtida
    // (aks holda server UTC'da, brauzer mahalliy vaqtda yozib, gidratsiya farq qiladi).
    timeZone: "Asia/Tashkent",
    messages: center.flagship ? messages : rebrandMessages(messages, locale, center.name),
  };
});
