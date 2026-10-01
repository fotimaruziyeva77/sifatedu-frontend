"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";

import { FormError, PasswordInput } from "./fields";

/** Parolni o'zgartirish: joriy sessiya qoladi, boshqa qurilmalar chiqariladi. */
export function PasswordForm() {
  const t = useTranslations("Dashboard");
  const tAuth = useTranslations("Auth");
  const [values, setValues] = useState({ current_password: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      const { response, error: failure } = await api.POST("/api/v1/me/password/", {
        body: values,
      });
      if (response.status === 204) {
        toast.success(t("passwordChanged"));
        setValues({ current_password: "", password: "" });
        return;
      }
      const parsed = readApiError(failure);
      const fields = Object.fromEntries(
        Object.entries(parsed?.fields ?? {}).map(([key, messages]) => [key, messages[0] ?? ""]),
      );
      setErrors(fields);
      if (Object.keys(fields).length === 0) {
        setError(parsed?.message ?? tAuth("errors.server"));
      }
    } catch {
      setError(tAuth("errors.network"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <PasswordInput
          id="current-password"
          label={t("currentPassword")}
          autoComplete="current-password"
          error={
            errors.current_password
              ? { message: errors.current_password, type: "server" }
              : undefined
          }
          value={values.current_password}
          onChange={(event) => setValues({ ...values, current_password: event.target.value })}
        />
        <PasswordInput
          id="new-password"
          label={t("newPassword")}
          hint={tAuth("passwordHint")}
          autoComplete="new-password"
          error={errors.password ? { message: errors.password, type: "server" } : undefined}
          value={values.password}
          onChange={(event) => setValues({ ...values, password: event.target.value })}
        />
        <FormError message={error} />
        <Button type="submit" disabled={saving} className="h-12 w-fit rounded-full px-6">
          {saving ? t("saving") : t("changePassword")}
        </Button>
      </FieldGroup>
    </form>
  );
}
