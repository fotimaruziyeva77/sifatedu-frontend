/**
 * Brauzerdagi xatolar Sentry'ga. DSN bo'lmasa hech narsa yuklanmaydi: SDK alohida bo'lakda
 * (dynamic import), shuning uchun sahifa hajmiga ta'sir qilmaydi.
 */
import { maskPhones } from "./lib/scrub";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  void import("@sentry/browser")
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "production",
        // SDK standart holatda cookie, sarlavha va so'rov tanasini ham yig'adi — o'chiramiz:
        // xatoni tushunish uchun ular kerak emas, shaxsiy ma'lumot esa ketmasligi kerak.
        dataCollection: {
          userInfo: false,
          cookies: false,
          httpHeaders: false,
          httpBodies: [],
          urlQueryParams: false,
        },
        tracesSampleRate: 0,
        beforeSend(event) {
          if (event.message) event.message = maskPhones(event.message);
          for (const value of event.exception?.values ?? []) {
            if (value.value) value.value = maskPhones(value.value);
          }
          return event;
        },
      });
    })
    .catch(() => {
      // Monitoring yuklanmasa ham sayt ishlashda davom etadi.
    });
}
