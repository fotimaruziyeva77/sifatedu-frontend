import {
  Award,
  Bell,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Compass,
  CreditCard,
  GraduationCap,
  House,
  Medal,
  Settings,
  ShoppingBag,
  Sparkles,
  Trophy,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

/** Kabinet menyusi. Ikkala ko'rinish (kattalar va bolalar) bir xil bo'limlardan iborat. */
export type NavItem = {
  href:
    | "/dashboard"
    | "/dashboard/teaching"
    | "/dashboard/reviews"
    | "/dashboard/courses"
    | "/dashboard/schedule"
    | "/dashboard/homework"
    | "/dashboard/exams"
    | "/dashboard/rewards"
    | "/dashboard/rating"
    | "/dashboard/shop"
    | "/dashboard/certificates"
    | "/dashboard/catalog"
    | "/dashboard/orders"
    | "/dashboard/notifications"
    | "/dashboard/settings";
  icon: LucideIcon;
  labelKey:
    | "home"
    | "teaching"
    | "reviews"
    | "courses"
    | "schedule"
    | "homework"
    | "exams"
    | "rewards"
    | "rating"
    | "shop"
    | "certificates"
    | "catalog"
    | "orders"
    | "notifications"
    | "settings";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", icon: House, labelKey: "home" },
  { href: "/dashboard/courses", icon: GraduationCap, labelKey: "courses" },
  { href: "/dashboard/homework", icon: ClipboardList, labelKey: "homework" },
  { href: "/dashboard/exams", icon: Trophy, labelKey: "exams" },
  { href: "/dashboard/rewards", icon: Sparkles, labelKey: "rewards" },
  { href: "/dashboard/rating", icon: Medal, labelKey: "rating" },
  { href: "/dashboard/shop", icon: ShoppingBag, labelKey: "shop" },
  { href: "/dashboard/certificates", icon: Award, labelKey: "certificates" },
  { href: "/dashboard/catalog", icon: Compass, labelKey: "catalog" },
  { href: "/dashboard/orders", icon: CreditCard, labelKey: "orders" },
  { href: "/dashboard/notifications", icon: Bell, labelKey: "notifications" },
  { href: "/dashboard/settings", icon: Settings, labelKey: "settings" },
];

const TEACHING: NavItem = { href: "/dashboard/teaching", icon: UsersRound, labelKey: "teaching" };
const REVIEWS: NavItem = { href: "/dashboard/reviews", icon: ClipboardCheck, labelKey: "reviews" };
const SCHEDULE: NavItem = { href: "/dashboard/schedule", icon: CalendarDays, labelKey: "schedule" };

/** Admin panelga kiradigan rollar (backend: apps/users/roles.py). */
const STAFF_ROLES = new Set(["TEACHER", "MANAGER", "DIRECTOR", "ADMIN"]);

/**
 * Menyu rolga qarab: o'qituvchiga bosh sahifadan keyin "Guruhlarim" va "Tekshirish";
 * admin ham uy vazifalarini tekshira oladi. "Jadval" — guruhda o'qiydigan yoki guruhga dars
 * beradiganlarga (`schedule`), "Mening kurslarim"dan keyin.
 */
export function navFor(roles: readonly string[], { schedule = false } = {}): NavItem[] {
  const extra = [
    ...(roles.includes("TEACHER") ? [TEACHING] : []),
    ...(roles.includes("TEACHER") || roles.includes("ADMIN") ? [REVIEWS] : []),
  ];
  const [home, ...rest] = NAV_ITEMS;
  const items = [home, ...extra, ...rest];
  if (!schedule) return extra.length === 0 ? NAV_ITEMS : items;
  const courses = items.findIndex((item) => item.href === "/dashboard/courses");
  return [...items.slice(0, courses + 1), SCHEDULE, ...items.slice(courses + 1)];
}

/** Xodim (o'qituvchi, menejer, direktor, admin) — menyuda boshqaruv paneli havolasi. */
export function isStaff(roles: readonly string[]): boolean {
  return roles.some((role) => STAFF_ROLES.has(role));
}

/** Menyudagi son (o'qilmagan xabarlar, tekshiriladigan vazifalar): katta sonlar "9+". */
export function unreadBadge(count: number): string | null {
  if (count <= 0) return null;
  return count > 9 ? "9+" : String(count);
}

/** `KIDS` — SIFAT Kids o'quvchisi (7–11 yosh), qolganlar uchun odatiy kabinet. */
export type Audience = "ADULT" | "KIDS";

export function audienceOf(value: string | undefined): Audience {
  return value === "KIDS" ? "KIDS" : "ADULT";
}
