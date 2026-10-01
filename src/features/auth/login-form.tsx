"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";
import { formatPhoneInput, isCompletePhone } from "@/lib/phone";

import { FormError, PasswordInput, PhoneInput } from "./fields";
import { useAuthResult } from "./use-auth-result";

type Values = { phone: string; password: string };

export function LoginForm() {
  const t = useTranslations("Auth");
  const handleResult = useAuthResult();
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        phone: z.string().refine(isCompletePhone, t("errors.phoneInvalid")),
        password: z.string().min(1, t("errors.passwordShort")),
      }),
    [t],
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { phone: "+998", password: "" },
  });

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      const { data, error } = await api.POST("/api/v1/auth/login/", { body: values });
      if (data) {
        handleResult({ status: "ok", user: data });
        return;
      }
      const parsed = readApiError(error);
      setFormError(parsed?.fields?.non_field_errors?.[0] ?? parsed?.message ?? t("errors.server"));
    } catch {
      setFormError(t("errors.network"));
    }
  }

  const { errors, isSubmitting } = form.formState;

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          control={form.control}
          name="phone"
          render={({ field }) => (
            <PhoneInput
              id="login-phone"
              label={t("phone")}
              error={errors.phone}
              value={field.value}
              onChange={(value) => field.onChange(formatPhoneInput(value))}
              autoFocus
            />
          )}
        />
        <PasswordInput
          id="login-password"
          label={t("password")}
          error={errors.password}
          {...form.register("password")}
        />
        <FormError message={formError} />
        <Button type="submit" disabled={isSubmitting} className="auth-submit">
          {isSubmitting ? t("loading") : t("loginAction")}
          {!isSubmitting && <ArrowRight aria-hidden />}
        </Button>
        <Link href="/auth/forgot-password" className="auth-link text-center">
          {t("forgotPassword")}
        </Link>
      </FieldGroup>
    </form>
  );
}
