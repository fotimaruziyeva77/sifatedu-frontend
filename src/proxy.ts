import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import { routing } from "./i18n/routing";
import { buildCsp, createNonce, originOf, sentryOrigin } from "./lib/csp";

const handleI18nRouting = createMiddleware(routing);

const SESSION_COOKIE = "sessionid";
const PROTECTED = /^\/(uz|ru|en)?\/?dashboard(\/|$)/;
// Do'stning taklif havolasi (`?ref=KOD`): ro'yxatdan o'tishda backend shu cookie'ni o'qiydi.
const REFERRAL_COOKIE = "sifat_ref";
const REFERRAL_CODE = /^[A-Za-z2-9]{4,16}$/;
const REFERRAL_DAYS = 30;

/** Storage va CDN manzillari: ochiq fayllar URL'idan va qo'shimcha ro'yxatdan. */
const STORAGE_ORIGINS = [
  originOf(process.env.NEXT_PUBLIC_S3_PUBLIC_URL),
  ...(process.env.CSP_EXTRA_ORIGINS ?? "").split(",").map((value) => originOf(value.trim())),
].filter((value): value is string => Boolean(value));

const REPORT_ORIGIN = sentryOrigin(process.env.NEXT_PUBLIC_SENTRY_DSN) ?? undefined;

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Tez tekshiruv: sessiya cookie'si yo'q bo'lsa, kabinetni yuklamaymiz.
  // Haqiqiy tekshiruv baribir serverda (`/me/`) bo'ladi — cookie bor-yo'qligi kafolat emas.
  if (PROTECTED.test(pathname) && !request.cookies.has(SESSION_COOKIE)) {
    const locale = routing.locales.find(
      (code) => pathname === `/${code}` || pathname.startsWith(`/${code}/`),
    );
    const login = new URL(`/${locale ?? routing.defaultLocale}/auth/login`, request.url);
    // `next` til prefiksisiz: kirgandan keyin uni next-intl router o'zi qo'shadi.
    const target = locale ? pathname.slice(locale.length + 1) || "/" : pathname;
    login.searchParams.set("next", `${target}${search}`);
    return NextResponse.redirect(login);
  }

  // CSP: Next.js nonce'ni so'rov sarlavhasidan o'qiydi va o'z skriptlariga qo'yadi.
  // next-intl so'rov sarlavhalarini render'ga o'tkazadi, shuning uchun ular shu yerda qo'shiladi.
  const nonce = createNonce();
  const csp = buildCsp({
    nonce,
    dev: process.env.NODE_ENV === "development",
    storage: STORAGE_ORIGINS,
    reportOrigin: REPORT_ORIGIN,
  });
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp);

  const response = handleI18nRouting(new NextRequest(request, { headers }));
  response.headers.set("Content-Security-Policy", csp);
  const referral = request.nextUrl.searchParams.get("ref");
  if (referral && REFERRAL_CODE.test(referral)) {
    response.cookies.set(REFERRAL_COOKIE, referral.toUpperCase(), {
      maxAge: REFERRAL_DAYS * 24 * 60 * 60,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }
  return response;
}

export const config = {
  // Backend yo'llari (nginx orqali), healthcheck, Next ichki yo'llari va fayllar bundan mustasno.
  matcher: ["/((?!api|admin|static|healthz|_next|_vercel|.*\\..*).*)"],
};
