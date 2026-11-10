"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormError } from "@/features/auth/fields";
import { api } from "@/lib/api/client";
import type { CenterSetup } from "@/lib/api/center-setup-types";

import { useSave } from "./use-save";

const INPUT = "h-12 text-base md:text-base";

/** Markazning o'z SMS hisobi. Parol qaytarib ko'rsatilmaydi. */
export function EskizCard({ eskiz }: { eskiz: CenterSetup["eskiz"] }) {
  const t = useTranslations("CenterSettings");
  const { save, error, busy } = useSave();
  const [email, setEmail] = useState(eskiz.email);
  const [password, setPassword] = useState("");
  const [sender, setSender] = useState(eskiz.sender);

  return (
    <form
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        const done = await save(() =>
          api.PUT("/api/v1/center/eskiz/", { body: { email, password, sender } }),
        );
        if (done) setPassword("");
      }}
    >
      <FieldGroup>
        <p className="text-sm text-muted-foreground">
          {eskiz.connected ? t("eskizConnected") : t("eskizText")}
        </p>
        <Field>
          <FieldLabel htmlFor="eskiz-email">{t("eskizEmail")}</FieldLabel>
          <Input
            id="eskiz-email"
            type="email"
            autoComplete="off"
            className={INPUT}
            value={email}
            onChange={(event) => setEmail(event.target.value.trim())}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="eskiz-password">{t("eskizPassword")}</FieldLabel>
          <Input
            id="eskiz-password"
            type="password"
            autoComplete="off"
            className={INPUT}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="eskiz-sender">{t("eskizSender")}</FieldLabel>
          <Input
            id="eskiz-sender"
            className={`${INPUT} font-mono`}
            value={sender}
            onChange={(event) => setSender(event.target.value.trim())}
          />
        </Field>
        <FormError message={error} />
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            className="h-12 rounded-full px-6"
            disabled={busy || !email || !password}
          >
            {eskiz.connected ? t("save") : t("connect")}
          </Button>
          {eskiz.connected && (
            <Button
              type="button"
              variant="ghost"
              className="h-12 rounded-full px-6 text-muted-foreground"
              disabled={busy}
              onClick={() => void save(() => api.DELETE("/api/v1/center/eskiz/"))}
            >
              {t("disconnect")}
            </Button>
          )}
        </div>
      </FieldGroup>
    </form>
  );
}
