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

const INPUT = "h-12 font-mono text-base md:text-base";

/** Click hisobi: pul to'g'ridan-to'g'ri markazga tushadi. Maxfiy kalit qaytarib ko'rsatilmaydi. */
export function ClickCard({ click }: { click: CenterSetup["click"] }) {
  const t = useTranslations("CenterSettings");
  const { save, error, busy } = useSave();
  const [values, setValues] = useState({
    service_id: click.service_id,
    merchant_id: click.merchant_id,
    merchant_user_id: click.merchant_user_id,
    tin: click.tin,
    secret_key: "",
  });

  function input(key: keyof typeof values, label: string, type = "text") {
    return (
      <Field>
        <FieldLabel htmlFor={`click-${key}`}>{label}</FieldLabel>
        <Input
          id={`click-${key}`}
          type={type}
          autoComplete="off"
          className={INPUT}
          value={values[key]}
          onChange={(event) => setValues({ ...values, [key]: event.target.value.trim() })}
        />
      </Field>
    );
  }

  return (
    <form
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        const done = await save(() => api.PUT("/api/v1/center/click/", { body: values }));
        if (done) setValues((current) => ({ ...current, secret_key: "" }));
      }}
    >
      <FieldGroup>
        {click.connected && <p className="font-medium">{t("clickConnected")}</p>}
        {input("service_id", t("serviceId"))}
        {input("merchant_id", t("merchantId"))}
        {input("merchant_user_id", t("merchantUserId"))}
        <div>
          {input("secret_key", t("secretKey"), "password")}
          {click.connected && (
            <FieldDescription className="mt-2">{t("secretKeyKept")}</FieldDescription>
          )}
        </div>
        {input("tin", t("tin"))}

        <div className="text-sm">
          <p className="text-muted-foreground">{t("clickUrls")}</p>
          <dl className="mt-2 grid gap-1 font-mono text-xs break-all">
            <dt className="text-muted-foreground">Prepare URL</dt>
            <dd>{click.prepare_url}</dd>
            <dt className="mt-1 text-muted-foreground">Complete URL</dt>
            <dd>{click.complete_url}</dd>
          </dl>
        </div>

        <FormError message={error} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="h-12 rounded-full px-6" disabled={busy}>
            {click.connected ? t("save") : t("connect")}
          </Button>
          {click.connected && (
            <Button
              type="button"
              variant="ghost"
              className="h-12 rounded-full px-6 text-muted-foreground"
              disabled={busy}
              onClick={() => void save(() => api.DELETE("/api/v1/center/click/"))}
            >
              {t("disconnect")}
            </Button>
          )}
        </div>
      </FieldGroup>
    </form>
  );
}
