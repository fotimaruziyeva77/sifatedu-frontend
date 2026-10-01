"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { useTheme } from "@/components/theme/use-theme";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";

import { useAuthResult } from "./use-auth-result";

export type SocialProviders = { google_client_id: string; telegram_bot: string };

type GoogleCredential = { credential?: string };

type GoogleId = {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredential) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client";
const TELEGRAM_SCRIPT = "https://telegram.org/js/telegram-widget.js?22";

/** Tashqi skriptni bir marta yuklaydi (ikkala sahifada ham qayta yuklanmaydi). */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing?.dataset.loaded === "1") {
      resolve();
      return;
    }
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => {
      script.dataset.loaded = "1";
      resolve();
    });
    script.addEventListener("error", () => reject(new Error(src)));
    if (!existing) {
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

/**
 * Google va Telegram tugmalari. Ikkalasi ham provayderning o'z widget'i: foydalanuvchi ularni
 * taniydi va brend qoidalariga mos bo'ladi. Sozlanmagan provayder ko'rinmaydi.
 */
export function SocialSignIn({ providers }: { providers: SocialProviders }) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const theme = useTheme();
  const handleResult = useAuthResult();
  const [error, setError] = useState<string | null>(null);
  const googleSlot = useRef<HTMLDivElement>(null);
  const telegramSlot = useRef<HTMLDivElement>(null);
  const next = useSearchParams().get("next");

  const submit = useCallback(
    async (path: "/api/v1/auth/social/google/" | "/api/v1/auth/social/telegram/", body: object) => {
      setError(null);
      try {
        const { data, error: failure } = await api.POST(path, { body: body as never });
        if (data) {
          handleResult(data);
          return;
        }
        setError(readApiError(failure)?.message ?? t("errors.server"));
      } catch {
        setError(t("errors.network"));
      }
    },
    [handleResult, t],
  );

  // Google: rasmiy tugma (kirish oynasi va token shu widget orqali keladi).
  useEffect(() => {
    const clientId = providers.google_client_id;
    const slot = googleSlot.current;
    if (!clientId || !slot) return;
    let cancelled = false;

    loadScript(GOOGLE_SCRIPT)
      .then(() => {
        if (cancelled || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => {
            if (credential) void submit("/api/v1/auth/social/google/", { credential });
          },
          cancel_on_tap_outside: true,
        });
        slot.replaceChildren();
        window.google.accounts.id.renderButton(slot, {
          type: "standard",
          theme: theme === "dark" ? "filled_black" : "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "center",
          locale,
          // Google kengligi 200–400 px oralig'ida bo'lishi shart.
          width: Math.min(400, Math.max(200, Math.round(slot.clientWidth) || 320)),
        });
      })
      .catch(() => setError(t("errors.googleFailed")));

    return () => {
      cancelled = true;
      // Dev rejimida effect ikki marta ishlaydi: eski tugma qoldirilmaydi.
      slot.replaceChildren();
    };
  }, [providers.google_client_id, theme, locale, submit, t]);

  // Telegram: kirgach widget brauzerni qaytish sahifasiga yo'naltiradi (`data-auth-url`).
  // `data-onauth` ishlatilmaydi: widget uni eval bilan chaqiradi, CSP esa eval'ni taqiqlaydi.
  useEffect(() => {
    const bot = providers.telegram_bot;
    const slot = telegramSlot.current;
    if (!bot || !slot) return;

    const target = new URL(`/${locale}/auth/telegram`, window.location.origin);
    if (next) target.searchParams.set("next", next);
    const script = document.createElement("script");
    script.src = TELEGRAM_SCRIPT;
    script.async = true;
    script.dataset.telegramLogin = bot;
    script.dataset.size = "large";
    script.dataset.radius = "24";
    script.dataset.userpic = "false";
    script.dataset.authUrl = target.toString();
    script.dataset.requestAccess = "write";
    slot.replaceChildren(script);

    return () => slot.replaceChildren();
  }, [providers.telegram_bot, locale, next]);

  if (!providers.google_client_id && !providers.telegram_bot) return null;

  return (
    <div className="grid gap-3">
      {providers.google_client_id && (
        <div ref={googleSlot} className="social-slot" role="group" aria-label={t("google")} />
      )}
      {providers.telegram_bot && (
        <div ref={telegramSlot} className="social-slot" role="group" aria-label={t("telegram")} />
      )}
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
    </div>
  );
}
