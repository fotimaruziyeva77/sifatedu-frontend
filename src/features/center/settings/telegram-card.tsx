"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormError } from "@/features/auth/fields";
import { api } from "@/lib/api/client";
import type { CenterSetup } from "@/lib/api/center-setup-types";

import { useSave } from "./use-save";

const INPUT = "h-12 text-base md:text-base";

/** O'z boti: token tekshiriladi, webhook, menyu va tavsif o'zi yoziladi. */
export function TelegramCard({
  telegram,
  domain,
}: {
  telegram: CenterSetup["telegram"];
  domain: string;
}) {
  const t = useTranslations("CenterSettings");
  const { save, error, busy } = useSave();
  const [token, setToken] = useState("");
  const [leads, setLeads] = useState(telegram.leads_chat);
  const [reports, setReports] = useState(telegram.reports_chat);
  const [login, setLogin] = useState(telegram.login);

  if (!telegram.connected) {
    return (
      <form
        noValidate
        onSubmit={async (event) => {
          event.preventDefault();
          const done = await save(() => api.PUT("/api/v1/center/telegram/", { body: { token } }));
          if (done) setToken("");
        }}
      >
        <FieldGroup>
          <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
            <li>{t("botStep1")}</li>
            <li>{t("botStep2")}</li>
          </ol>
          <Field>
            <FieldLabel htmlFor="bot-token">{t("botToken")}</FieldLabel>
            <Input
              id="bot-token"
              type="password"
              autoComplete="off"
              className={`${INPUT} font-mono`}
              value={token}
              onChange={(event) => setToken(event.target.value.trim())}
            />
          </Field>
          <FormError message={error} />
          <Button type="submit" className="h-12 w-fit rounded-full px-6" disabled={busy || !token}>
            {t("connectBot")}
          </Button>
        </FieldGroup>
      </form>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void save(() =>
          api.PATCH("/api/v1/center/telegram/", {
            body: { leads_chat: leads, reports_chat: reports, login },
          }),
        );
      }}
    >
      <FieldGroup>
        <p className="font-medium">{t("connectedBot", { username: telegram.username })}</p>
        <Field>
          <FieldLabel htmlFor="bot-leads">{t("leadsChat")}</FieldLabel>
          <Input
            id="bot-leads"
            className={`${INPUT} font-mono`}
            value={leads}
            onChange={(event) => setLeads(event.target.value)}
          />
          <FieldDescription>{t("leadsChatHint")}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="bot-reports">{t("reportsChat")}</FieldLabel>
          <Input
            id="bot-reports"
            className={`${INPUT} font-mono`}
            value={reports}
            onChange={(event) => setReports(event.target.value)}
          />
        </Field>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 size-4"
            checked={login}
            onChange={(event) => setLogin(event.target.checked)}
          />
          <span>
            <span className="font-medium">{t("telegramLogin")}</span>
            <span className="mt-1 block text-muted-foreground">
              {t("telegramLoginHint", { domain })}
            </span>
          </span>
        </label>
        <FormError message={error} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="h-12 rounded-full px-6" disabled={busy}>
            {t("save")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-12 rounded-full px-6 text-muted-foreground"
            disabled={busy}
            onClick={() => void save(() => api.DELETE("/api/v1/center/telegram/"))}
          >
            {t("disconnect")}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
