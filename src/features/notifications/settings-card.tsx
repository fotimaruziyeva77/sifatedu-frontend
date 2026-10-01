"use client";

import { BellRing, CheckCircle2, ExternalLink, Send, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/schema";

type Settings = components["schemas"]["NotificationSettings"];

const POLL_MS = 3000;
// Havola 10 daqiqa amal qiladi (backend: linking.TOKEN_TTL_SECONDS).
const WAIT_MS = 10 * 60 * 1000;

/**
 * Sozlamalar → Xabarnomalar: Telegram'ni ulash va aksiyalar roziligi.
 *
 * Ulash ikki bosqichda: avval bir martalik havola olinadi, keyin foydalanuvchi uni o'zi
 * bosadi. Havolani darhol `window.open` bilan ochish telefon brauzerlarida bloklanadi.
 * Foydalanuvchi botda "Start" bosguncha holat har 3 soniyada tekshiriladi.
 */
export function NotificationSettingsCard({ initial }: { initial: Settings }) {
  const t = useTranslations("Notifications");
  const [settings, setSettings] = useState(initial);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const telegram = settings.telegram;

  useEffect(() => {
    if (!link) return;
    const started = Date.now();
    const timer = window.setInterval(async () => {
      if (Date.now() - started > WAIT_MS) {
        setLink(null);
        setMessage(t("linkExpired"));
        return;
      }
      try {
        const { data } = await api.GET("/api/v1/me/notifications/");
        if (data?.telegram.connected && !data.telegram.blocked) {
          setSettings(data);
          setLink(null);
          setMessage(t("connectedNow"));
        }
      } catch {
        // Keyingi urinishda.
      }
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [link, t]);

  async function connect() {
    setBusy(true);
    setMessage(null);
    try {
      const { data, error } = await api.POST("/api/v1/me/telegram/connect/");
      if (data) setLink(data.url);
      else setMessage(readApiError(error)?.message ?? t("failed"));
    } catch {
      setMessage(t("failed"));
    } finally {
      setBusy(false);
    }
  }

  async function update(patch: { telegram_notify?: boolean; marketing_consent?: boolean }) {
    const previous = settings;
    setMessage(null);
    // Darhol ko'rsatamiz, xato bo'lsa qaytaramiz.
    setSettings({
      telegram: {
        ...previous.telegram,
        notify: patch.telegram_notify ?? previous.telegram.notify,
      },
      marketing_consent: patch.marketing_consent ?? previous.marketing_consent,
    });
    try {
      const { data } = await api.PATCH("/api/v1/me/notifications/", { body: patch });
      if (data) {
        setSettings(data);
        return;
      }
    } catch {
      // pastda qaytariladi
    }
    setSettings(previous);
    setMessage(t("failed"));
  }

  return (
    <div className="grid gap-6">
      <div className="notify-telegram">
        <span aria-hidden className="notify-telegram__icon">
          <Send className="size-5" />
        </span>
        <div className="grid gap-3">
          <p className="font-medium">{t("telegramTitle")}</p>

          {!telegram.available ? (
            <p className="text-sm text-muted-foreground">{t("telegramUnavailable")}</p>
          ) : telegram.connected && !telegram.blocked ? (
            <>
              <p className="notify-status">
                <CheckCircle2 aria-hidden className="size-4" />
                {t("telegramConnected")}
              </p>
              <label className="notify-check">
                <input
                  type="checkbox"
                  checked={telegram.notify}
                  onChange={(event) => void update({ telegram_notify: event.target.checked })}
                />
                <span>{t("telegramNotify")}</span>
              </label>
            </>
          ) : link ? (
            <>
              <p className="text-sm text-pretty text-muted-foreground">{t("telegramSteps")}</p>
              <Button asChild className="h-11 w-fit gap-2 rounded-full px-5">
                <a href={link} target="_blank" rel="noopener noreferrer">
                  {t("telegramOpen")}
                  <ExternalLink aria-hidden />
                </a>
              </Button>
              <p className="notify-waiting text-sm text-muted-foreground">
                <BellRing aria-hidden className="size-4" />
                {t("telegramWaiting")}
              </p>
            </>
          ) : (
            <>
              {telegram.blocked ? (
                <p className="notify-status notify-status--warn">
                  <TriangleAlert aria-hidden className="size-4" />
                  {t("telegramBlocked")}
                </p>
              ) : (
                <p className="text-sm text-pretty text-muted-foreground">{t("telegramIntro")}</p>
              )}
              <Button
                type="button"
                onClick={() => void connect()}
                disabled={busy}
                className="h-11 w-fit gap-2 rounded-full px-5"
              >
                <Send aria-hidden />
                {busy ? t("loading") : t("telegramConnect")}
              </Button>
            </>
          )}
        </div>
      </div>

      <label className="notify-check">
        <input
          type="checkbox"
          checked={settings.marketing_consent}
          onChange={(event) => void update({ marketing_consent: event.target.checked })}
        />
        <span>
          {t("marketing")}
          <em>{t("marketingHint")}</em>
        </span>
      </label>

      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
