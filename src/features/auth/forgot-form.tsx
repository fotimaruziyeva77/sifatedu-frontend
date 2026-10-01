"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";
import { formatPhoneInput, isCompletePhone } from "@/lib/phone";

import { CodeInput, FormError, PasswordInput, PhoneInput } from "./fields";
import { ResendTimer } from "./resend-timer";
import { useAuthResult } from "./use-auth-result";
import { useOtp } from "./use-otp";

type Values = { phone: string; code: string; password: string };

/** Ikki qadam: telefon → SMS kod va yangi parol. */
export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const handleResult = useAuthResult();
  const { sendCode, sending, resendUntil, error: otpError, setError: setOtpError } = useOtp();
  const [step, setStep] = useState<"phone" | "reset">("phone");
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        phone: z.string().refine(isCompletePhone, t("errors.phoneInvalid")),
        code: z.string().regex(/^\d{6}$/, t("errors.codeInvalid")),
        password: z.string().min(8, t("errors.passwordShort")).max(128),
      }),
    [t],
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { phone: "+998", code: "", password: "" },
  });

  // Kod yuborilgan raqam: ikkinchi qadamda ko'rsatiladi va qayta yuborishda ishlatiladi.
  const [phone, setPhone] = useState("");

  async function requestCode() {
    const valid = await form.trigger("phone");
    if (!valid) return;
    const value = form.getValues("phone");
    if (!(await sendCode(value, "reset"))) return;
    setPhone(value);
    setStep("reset");
  }

  async function onSubmit(values: Values) {
    setFormError(null);
    setOtpError(null);
    try {
      const { data, error } = await api.POST("/api/v1/auth/password/reset/", { body: values });
      if (data) {
        handleResult({ status: "ok", user: data });
        return;
      }
      const parsed = readApiError(error);
      for (const [name, messages] of Object.entries(parsed?.fields ?? {})) {
        if (name in values && messages?.[0]) {
          form.setError(name as keyof Values, { message: messages[0] }, { shouldFocus: true });
        }
      }
      if (!parsed?.fields || parsed.fields.non_field_errors) {
        setFormError(
          parsed?.fields?.non_field_errors?.[0] ?? parsed?.message ?? t("errors.server"),
        );
      }
    } catch {
      setFormError(t("errors.network"));
    }
  }

  const { errors, isSubmitting } = form.formState;

  if (step === "phone") {
    return (
      <FieldGroup>
        <Controller
          control={form.control}
          name="phone"
          render={({ field }) => (
            <PhoneInput
              id="forgot-phone"
              label={t("phone")}
              error={errors.phone}
              value={field.value}
              onChange={(value) => field.onChange(formatPhoneInput(value))}
              autoFocus
            />
          )}
        />
        <FormError message={otpError} />
        <Button type="button" onClick={requestCode} disabled={sending} className="auth-submit">
          {sending ? t("loading") : t("sendCode")}
          {!sending && <ArrowRight aria-hidden />}
        </Button>
      </FieldGroup>
    );
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="auth-sent">
          <p>{t("codeSentTo", { phone })}</p>
          <button type="button" onClick={() => setStep("phone")} className="auth-link">
            <ArrowLeft aria-hidden className="inline size-3.5" /> {t("changePhone")}
          </button>
        </div>

        <CodeInput
          id="forgot-code"
          label={t("code")}
          error={errors.code}
          {...form.register("code")}
        />
        <ResendTimer
          key={resendUntil}
          until={resendUntil}
          disabled={sending}
          onResend={() => void sendCode(phone, "reset")}
        />
        <PasswordInput
          id="forgot-password"
          label={t("newPassword")}
          hint={t("passwordHint")}
          autoComplete="new-password"
          error={errors.password}
          {...form.register("password")}
        />
        <FormError message={formError ?? otpError} />
        <Button type="submit" disabled={isSubmitting} className="auth-submit">
          {isSubmitting ? t("loading") : t("resetAction")}
          {!isSubmitting && <ArrowRight aria-hidden />}
        </Button>
      </FieldGroup>
    </form>
  );
}
