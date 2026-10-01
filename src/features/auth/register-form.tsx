"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";
import { formatPhoneInput, isCompletePhone } from "@/lib/phone";

import { CodeInput, FormError, MarketingConsent, PasswordInput, PhoneInput } from "./fields";
import { ResendTimer } from "./resend-timer";
import { useAuthResult } from "./use-auth-result";
import { useOtp } from "./use-otp";

type Values = {
  phone: string;
  code: string;
  first_name: string;
  last_name: string;
  password: string;
};

/** Ikki qadam: telefon → SMS kod, ism va parol. */
export function RegisterForm() {
  const t = useTranslations("Auth");
  const handleResult = useAuthResult();
  const { sendCode, sending, resendUntil, error: otpError, setError: setOtpError } = useOtp();
  const [step, setStep] = useState<"phone" | "details">("phone");
  const [formError, setFormError] = useState<string | null>(null);
  const [marketing, setMarketing] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        phone: z.string().refine(isCompletePhone, t("errors.phoneInvalid")),
        code: z.string().regex(/^\d{6}$/, t("errors.codeInvalid")),
        first_name: z.string().trim().min(1, t("errors.nameRequired")).max(150),
        last_name: z.string().trim().max(150),
        password: z.string().min(8, t("errors.passwordShort")).max(128),
      }),
    [t],
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { phone: "+998", code: "", first_name: "", last_name: "", password: "" },
  });

  // Kod yuborilgan raqam: ikkinchi qadamda ko'rsatiladi va qayta yuborishda ishlatiladi.
  const [phone, setPhone] = useState("");

  async function requestCode() {
    const valid = await form.trigger("phone");
    if (!valid) return;
    const value = form.getValues("phone");
    if (!(await sendCode(value, "register"))) return;
    setPhone(value);
    setStep("details");
  }

  async function onSubmit(values: Values) {
    setFormError(null);
    setOtpError(null);
    try {
      const { data, error } = await api.POST("/api/v1/auth/register/", {
        body: { ...values, accept_terms: true, marketing_consent: marketing },
      });
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
              id="register-phone"
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
        <p className="text-center text-sm text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link href="/auth/login" className="auth-link">
            {t("loginLink")}
          </Link>
        </p>
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
          id="register-code"
          label={t("code")}
          error={errors.code}
          {...form.register("code")}
        />
        <ResendTimer
          key={resendUntil}
          until={resendUntil}
          disabled={sending}
          onResend={() => void sendCode(phone, "register")}
        />

        <Field data-invalid={Boolean(errors.first_name)}>
          <FieldLabel htmlFor="register-first-name">{t("firstName")}</FieldLabel>
          <Input
            id="register-first-name"
            autoComplete="given-name"
            aria-invalid={Boolean(errors.first_name)}
            className="h-12 text-base md:text-base"
            {...form.register("first_name")}
          />
          <FieldError errors={[errors.first_name]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="register-last-name">{t("lastNameOptional")}</FieldLabel>
          <Input
            id="register-last-name"
            autoComplete="family-name"
            className="h-12 text-base md:text-base"
            {...form.register("last_name")}
          />
        </Field>

        <PasswordInput
          id="register-password"
          label={t("password")}
          hint={t("passwordHint")}
          autoComplete="new-password"
          error={errors.password}
          {...form.register("password")}
        />

        <MarketingConsent checked={marketing} onChange={setMarketing} />

        <FormError message={formError ?? otpError} />
        <Button type="submit" disabled={isSubmitting} className="auth-submit">
          {isSubmitting ? t("loading") : t("registerAction")}
          {!isSubmitting && <ArrowRight aria-hidden />}
        </Button>
      </FieldGroup>
    </form>
  );
}
