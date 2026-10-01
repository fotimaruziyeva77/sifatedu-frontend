import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

/**
 * Brauzerga faqat shu sahifa guruhidagi client komponentlar ishlatadigan tarjimalar ketadi.
 *
 * Standart holatda next-intl hamma tarjimani (kabinet, to'lov, auth...) har bir sahifaning
 * HTML'iga qo'shadi — landing og'irlashadi va sekinroq gidratsiya bo'ladi. Server
 * komponentlari tarjimalarni serverning o'zida o'qiydi, ularga bu ro'yxat ta'sir qilmaydi.
 *
 * Yangi client komponent boshqa namespace ishlatsa, u shu yerdagi ro'yxatga qo'shiladi
 * (aks holda brauzerda MISSING_MESSAGE xatosi chiqadi — E2E testlari buni ushlaydi).
 */
const SHARED = ["Nav", "Theme"] as const;

export const CLIENT_NAMESPACES = {
  root: [...SHARED],
  site: [
    ...SHARED,
    "Courses",
    "Level",
    "Quiz",
    "Reel",
    "Lead",
    "Catalog",
    "Course",
    "Assistant",
    "Certificates",
  ],
  auth: [...SHARED, "Auth"],
  // Kabinet ichida katalog va kurs sahifasi ham bor (kartochka, filtr, sotib olish, ariza).
  app: [
    ...SHARED,
    "Dashboard",
    "Learn",
    "Payment",
    "Auth",
    "Course",
    "Courses",
    "Catalog",
    "Level",
    "Lead",
    "Notifications",
    "Homework",
    "Reviews",
    "LessonQuiz",
    "Schedule",
    "Exams",
    "TeacherExams",
    "Rewards",
    "Shop",
  ],
} as const;

export async function ClientMessages({
  group,
  children,
}: {
  group: keyof typeof CLIENT_NAMESPACES;
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  const picked: AbstractIntlMessages = {};
  for (const namespace of CLIENT_NAMESPACES[group]) {
    if (namespace in messages) picked[namespace] = messages[namespace];
  }
  return <NextIntlClientProvider messages={picked}>{children}</NextIntlClientProvider>;
}
