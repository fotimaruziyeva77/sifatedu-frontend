"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";
import { formatPhoneInput, isCompletePhone } from "@/lib/phone";

import { CodeInput, FormError, MarketingConsent, PhoneInput } from "./fields";
import { ResendTimer } from "./resend-timer";
import { SOCIAL_NAME_KEY, useAuthResult } from "./use-auth-result";
import { useOtp } from "./use-otp";

type Values = { phone: string; code: string };

/**
 * Google yoki Telegram'dan keyingi telefon qadami. Raqam boshqa akkauntga tegishli bo'lsa,
 * backend SMS kod so'raydi — shundagina ijtimoiy akkaunt o'sha akkauntga bog'lanadi.
 */
export function SocialPhoneForm() {
  const t = useTranslations("Auth");
  const handleResult = useAuthResult();
  const { sendCode, sending, resendUntil, error: otpError, setError: setOtpError } = useOtp();
  const [needsCode, setNeedsCode] = useState(false);
  // Ism ijtimoiy kirishdan keyin sessiya xotirasida turadi (server komponent uni bilmaydi).
  const [name] = useState(() => {
    try {
      return sessionStorage.getItem(SOCIAL_NAME_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [formError, setFormError] = useState<string | null>(null);
  // Faqat yangi akkaunt uchun: raqam band bo'lsa (bog'lash), rozilik so'ralmaydi.
  const [marketing, setMarketing] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        phone: z.string().refine(isCompletePhone, t("errors.phoneInvalid")),
        code: z.string(),
      }),
    [t],
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { phone: "+998", code: "" },
  });

  // Bog'lash kodi yuborilgan raqam (matnda ko'rsatiladi).
  const [phone, setPhone] = useState("");

  async function onSubmit(values: Values) {
    setFormError(null);
    setOtpError(null);
    if (needsCode && !/^\d{6}$/.test(values.code)) {
      form.setError("code", { message: t("errors.codeInvalid") }, { shouldFocus: true });
      return;
    }
    try {
      const { data, error } = await api.POST("/api/v1/auth/social/phone/", {
        body: needsCode
          ? { ...values, marketing_consent: false }
          : { phone: values.phone, marketing_consent: marketing },
      });
      if (data?.status === "code_required") {
        setNeedsCode(true);
        setPhone(values.phone);
        await sendCode(values.phone, "link");
        return;
      }
      if (data) {
        handleResult(data);
        return;
      }
      const parsed = readApiError(error);
      const fieldError = parsed?.fields?.phone?.[0] ?? parsed?.fields?.code?.[0];
      if (fieldError) {
        form.setError(parsed?.fields?.code ? "code" : "phone", { message: fieldError });
        return;
      }
      setFormError(parsed?.fields?.non_field_errors?.[0] ?? parsed?.message ?? t("errors.server"));
    } catch {
      setFormError(t("errors.network"));
    }
  }

  const { errors, isSubmitting } = form.formState;

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        {name && <p className="auth-greeting">{t("phoneTitleNamed", { name })}</p>}
        <Controller
          control={form.control}
          name="phone"
          render={({ field }) => (
            <PhoneInput
              id="social-phone"
              label={t("phone")}
              error={errors.phone}
              value={field.value}
              onChange={(value) => field.onChange(formatPhoneInput(value))}
              disabled={needsCode}
              autoFocus
            />
          )}
        />

        {needsCode && (
          <>
            <div className="auth-sent">
              <p className="font-medium text-foreground">{t("linkTitle")}</p>
              <p>{t("linkSubtitle", { phone })}</p>
            </div>
            <CodeInput
              id="social-code"
              label={t("code")}
              error={errors.code}
              {...form.register("code")}
            />
            <ResendTimer
              key={resendUntil}
              until={resendUntil}
              disabled={sending}
              onResend={() => void sendCode(phone, "link")}
            />
          </>
        )}

        {!needsCode && <MarketingConsent checked={marketing} onChange={setMarketing} />}

        <FormError message={formError ?? otpError} />
        <Button type="submit" disabled={isSubmitting || sending} className="auth-submit">
          {isSubmitting || sending ? t("loading") : t("continue")}
          {!isSubmitting && !sending && <ArrowRight aria-hidden />}
        </Button>
      </FieldGroup>
    </form>
  );
}
