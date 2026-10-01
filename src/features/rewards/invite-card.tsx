"use client";

import { Check, Copy, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/** Do'stni taklif qilish: shaxsiy havola (sayt va bot), nusxalash va Telegram'da ulashish. */
export function InviteCard({
  siteUrl,
  botUrl,
  invited,
}: {
  siteUrl: string;
  botUrl: string;
  invited: number;
}) {
  const t = useTranslations("Rewards");
  const [copied, setCopied] = useState(false);
  const share = `https://t.me/share/url?${new URLSearchParams({
    url: botUrl || siteUrl,
    text: t("inviteShare"),
  })}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt(t("copyManual"), siteUrl);
    }
  }

  return (
    <div className="rw-invite">
      <p className="rw-invite__link">
        <span className="sr-only">{t("inviteLink")}</span>
        <code>{siteUrl}</code>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => void copy()}
          className="h-10 gap-2 rounded-full px-4"
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? t("copied") : t("copy")}
        </Button>
        <Button asChild variant="outline" className="h-10 gap-2 rounded-full px-4">
          <a href={share} target="_blank" rel="noopener noreferrer">
            <Send aria-hidden />
            {t("shareTelegram")}
          </a>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t("invited", { count: invited })}</p>
    </div>
  );
}
