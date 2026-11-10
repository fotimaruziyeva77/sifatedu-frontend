"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CodeInput, FormError, PasswordInput, PhoneInput } from "@/features/auth/fields";
import { ResendTimer } from "@/features/auth/resend-timer";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";
import { formatPhoneInput, isCompletePhone } from "@/lib/phone";

import { SLUG_PATTERN, suggestSlug } from "./slug";

const CHECK_DELAY_MS = 350;
const POLL_MS = 2000;

type Values = {
  name: string;
  slug: string;
  plan: number;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
};

type Stage =
  | { name: "form" }
  | { name: "code"; token: string; phone: string; resendUntil: number }
  | { name: "preparing"; token: string }
  | { name: "ready"; url: string }
  | { name: "failed" };

type AddressState = "idle" | "checking" | "free" | "taken" | "reserved" | "invalid";

const INPUT = "h-12 text-base md:text-base";

function secondsFromNow(seconds: number): number {
  return Date.now() + seconds * 1000;
}

function useAddressState(slug: string): AddressState {
  const [result, setResult] = useState<{ slug: string; state: AddressState } | null>(null);
  const valid = SLUG_PATTERN.test(slug);

  useEffect(() => {
    if (!valid) return;
    const controller = new AbortController();
    const timer = globalThis.setTimeout(async () => {
      try {
        const { data } = await api.GET("/api/v1/platform/address/", {
          params: { query: { slug } },
          signal: controller.signal,
        });
        if (data) setResult({ slug, state: data.available ? "free" : data.reason });
      } catch {
        // Javob kelmasa, formani yuborishda server baribir tekshiradi.
        if (!controller.signal.aborted) setResult({ slug, state: "idle" });
      }
    }, CHECK_DELAY_MS);
    return () => {
      globalThis.clearTimeout(timer);
      controller.abort();
    };
  }, [slug, valid]);

  if (!slug) return "idle";
  if (!valid) return "invalid";
  return result?.slug === slug ? result.state : "checking";
}

export function SignupFlow({
  plans,
  initialPlan,
  baseDomain,
  title,
  text,
}: {
  plans: { id: number; name: string }[];
  initialPlan: number | undefined;
  baseDomain: string;
  title: string;
  text: string;
}) {
  const t = useTranslations("Platform");
  const [stage, setStage] = useState<Stage>({ name: "form" });
  const [formError, setFormError] = useState<string | null>(null);
  // Egasi manzilni o'zi yozmaguncha u markaz nomidan taklif qilinadi.
  const [slugEdited, setSlugEdited] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(2, t("errors.nameRequired"))
          .max(200)
          .regex(/^[^<>{}&]*$/, t("errors.nameChars")),
        slug: z.string().regex(SLUG_PATTERN, t("addressInvalid")),
        plan: z.number(),
        first_name: z.string().trim().min(1, t("errors.firstNameRequired")).max(150),
        last_name: z.string().trim().max(150),
        phone: z.string().refine(isCompletePhone, t("errors.phoneInvalid")),
        password: z.string().min(8, t("errors.passwordShort")).max(128),
      }),
    [t],
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      slug: "",
      plan: initialPlan ?? 0,
      first_name: "",
      last_name: "",
      phone: "+998",
      password: "",
    },
  });

  const slug = useWatch({ control: form.control, name: "slug" });
  const address = useAddressState(slug);
  const { errors, isSubmitting } = form.formState;

  async function submit(values: Values) {
    setFormError(null);
    try {
      const { data, error } = await api.POST("/api/v1/platform/signups/", { body: values });
      if (data) {
        setStage({
          name: "code",
          token: data.token,
          phone: values.phone,
          resendUntil: secondsFromNow(data.resend_in),
        });
        return;
      }
      const parsed = readApiError(error);
      let shown = false;
      for (const [field, messages] of Object.entries(parsed?.fields ?? {})) {
        if (field in values && messages?.[0]) {
          form.setError(field as keyof Values, { message: messages[0] }, { shouldFocus: true });
          shown = true;
        }
      }
      if (!shown) setFormError(parsed?.message || t("errors.server"));
    } catch {
      setFormError(t("errors.network"));
    }
  }

  if (stage.name === "code") {
    return (
      <CodeStep
        key={stage.token}
        stage={stage}
        onDone={() => setStage({ name: "preparing", token: stage.token })}
        onBack={(message) => {
          setFormError(message);
          setStage({ name: "form" });
        }}
      />
    );
  }

  if (stage.name === "preparing") {
    return (
      <Preparing
        token={stage.token}
        onReady={(url) => setStage({ name: "ready", url })}
        onFailed={() => setStage({ name: "failed" })}
      />
    );
  }

  if (stage.name === "ready") {
    return (
      <div className="pf-wait">
        <Check aria-hidden className="pf-done size-16" />
        <h1>{t("readyTitle")}</h1>
        <p className="pf-sheet__text">{t("readyText")}</p>
        <p className="pf-address-final">{new URL(stage.url).host}</p>
        <a href={stage.url} className="pf-btn">
          {t("enter")}
          <ArrowRight aria-hidden className="size-5" />
        </a>
      </div>
    );
  }

  if (stage.name === "failed") {
    return (
      <div className="pf-wait">
        <h1>{t("failedTitle")}</h1>
        <p className="pf-sheet__text">{t("failedText")}</p>
        <button type="button" className="pf-btn mt-4" onClick={() => setStage({ name: "form" })}>
          {t("tryAgain")}
        </button>
      </div>
    );
  }

  return (
    <>
      <h1>{title}</h1>
      <p className="pf-sheet__text">{text}</p>
      <form noValidate onSubmit={form.handleSubmit(submit)}>
        <FieldGroup>
          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor="signup-name">{t("centerName")}</FieldLabel>
            <Input
              id="signup-name"
              autoComplete="organization"
              autoFocus
              aria-invalid={Boolean(errors.name)}
              className={INPUT}
              {...form.register("name", {
                onChange: (event) => {
                  if (!slugEdited) {
                    form.setValue("slug", suggestSlug(event.target.value), {
                      shouldValidate: false,
                    });
                  }
                },
              })}
            />
            <FieldError errors={[errors.name]} />
          </Field>

          <Field data-invalid={Boolean(errors.slug)}>
            <FieldLabel htmlFor="signup-slug">{t("address")}</FieldLabel>
            <div className="pf-address">
              <Input
                id="signup-slug"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={Boolean(errors.slug)}
                aria-describedby="signup-slug-state"
                className={`${INPUT} font-mono`}
                {...form.register("slug", {
                  onChange: () => {
                    setSlugEdited(true);
                  },
                })}
              />
              <span className="pf-address__suffix">.{baseDomain}</span>
            </div>
            {errors.slug ? (
              <FieldError errors={[errors.slug]} />
            ) : (
              <AddressHint id="signup-slug-state" state={address} />
            )}
          </Field>

          {plans.length > 1 && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{t("plan")}</legend>
              <Controller
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <div className="pf-choice">
                    {plans.map((plan) => (
                      <div key={plan.id}>
                        <input
                          type="radio"
                          id={`signup-plan-${plan.id}`}
                          name={field.name}
                          checked={field.value === plan.id}
                          onChange={() => field.onChange(plan.id)}
                        />
                        <label htmlFor={`signup-plan-${plan.id}`}>{plan.name}</label>
                      </div>
                    ))}
                  </div>
                )}
              />
            </fieldset>
          )}

          <Field data-invalid={Boolean(errors.first_name)}>
            <FieldLabel htmlFor="signup-first-name">{t("firstName")}</FieldLabel>
            <Input
              id="signup-first-name"
              autoComplete="given-name"
              aria-invalid={Boolean(errors.first_name)}
              className={INPUT}
              {...form.register("first_name")}
            />
            <FieldError errors={[errors.first_name]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="signup-last-name">{t("lastName")}</FieldLabel>
            <Input
              id="signup-last-name"
              autoComplete="family-name"
              className={INPUT}
              {...form.register("last_name")}
            />
          </Field>

          <Controller
            control={form.control}
            name="phone"
            render={({ field }) => (
              <PhoneInput
                id="signup-phone"
                label={t("phone")}
                error={errors.phone}
                value={field.value}
                onChange={(value) => field.onChange(formatPhoneInput(value))}
              />
            )}
          />

          <PasswordInput
            id="signup-password"
            label={t("password")}
            hint={t("passwordHint")}
            autoComplete="new-password"
            error={errors.password}
            {...form.register("password")}
          />

          <FormError message={formError} />
          <button type="submit" className="pf-btn w-full" disabled={isSubmitting}>
            {isSubmitting ? t("working") : t("continue")}
            {!isSubmitting && <ArrowRight aria-hidden className="size-5" />}
          </button>
        </FieldGroup>
      </form>
    </>
  );
}

function AddressHint({ id, state }: { id: string; state: AddressState }) {
  const t = useTranslations("Platform");

  if (state === "free") {
    return (
      <p id={id} className="pf-address-state" data-ok="">
        {t("addressFree")}
      </p>
    );
  }
  if (state === "taken" || state === "reserved" || state === "invalid") {
    const key = { taken: "addressTaken", reserved: "addressReserved", invalid: "addressInvalid" }[
      state
    ] as "addressTaken" | "addressReserved" | "addressInvalid";
    return (
      <p id={id} className="pf-address-state" data-bad="">
        {t(key)}
      </p>
    );
  }
  return (
    <FieldDescription id={id}>
      {state === "checking" ? t("addressChecking") : t("addressHint")}
    </FieldDescription>
  );
}

function CodeStep({
  stage,
  onDone,
  onBack,
}: {
  stage: Extract<Stage, { name: "code" }>;
  onDone: () => void;
  onBack: (message: string | null) => void;
}) {
  const t = useTranslations("Platform");
  const [resendUntil, setResendUntil] = useState(stage.resendUntil);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const schema = useMemo(
    () => z.object({ code: z.string().regex(/^\d{6}$/, t("errors.codeInvalid")) }),
    [t],
  );
  const form = useForm<{ code: string }>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function resend() {
    setSending(true);
    setMessage(null);
    try {
      const { data, error, response } = await api.POST("/api/v1/platform/signups/{token}/resend/", {
        params: { path: { token: stage.token } },
      });
      if (data) {
        setResendUntil(secondsFromNow(data.resend_in));
        return;
      }
      const parsed = readApiError(error);
      if (response.status === 429) {
        setResendUntil(secondsFromNow(parsed?.retry_after ?? 60));
      }
      setMessage(parsed?.message || t("errors.server"));
    } catch {
      setMessage(t("errors.network"));
    } finally {
      setSending(false);
    }
  }

  async function verify({ code }: { code: string }) {
    setMessage(null);
    try {
      const { data, error } = await api.POST("/api/v1/platform/signups/{token}/verify/", {
        params: { path: { token: stage.token } },
        body: { code },
      });
      if (data) {
        onDone();
        return;
      }
      const parsed = readApiError(error);
      // Manzil shu orada band bo'ldi: boshqasini tanlash uchun formaga qaytamiz.
      if (parsed?.code === "address_taken") {
        onBack(parsed.message);
        return;
      }
      const fieldError = parsed?.fields?.code?.[0];
      if (fieldError) form.setError("code", { message: fieldError }, { shouldFocus: true });
      else setMessage(parsed?.message || t("errors.server"));
    } catch {
      setMessage(t("errors.network"));
    }
  }

  return (
    <>
      <h1>{t("codeTitle")}</h1>
      <p className="pf-sheet__text">{t("codeSent", { phone: stage.phone })}</p>
      <form noValidate onSubmit={form.handleSubmit(verify)}>
        <FieldGroup>
          <CodeInput
            id="signup-code"
            label={t("code")}
            error={errors.code}
            {...form.register("code")}
          />
          <ResendTimer
            key={resendUntil}
            until={resendUntil}
            disabled={sending}
            onResend={() => void resend()}
          />
          <FormError message={message} />
          <button type="submit" className="pf-btn w-full" disabled={isSubmitting}>
            {isSubmitting ? t("working") : t("open")}
            {!isSubmitting && <ArrowRight aria-hidden className="size-5" />}
          </button>
          <button
            type="button"
            className="pf-link justify-self-center"
            onClick={() => onBack(null)}
          >
            <ArrowLeft aria-hidden className="mr-1 inline size-4" />
            {t("edit")}
          </button>
        </FieldGroup>
      </form>
    </>
  );
}

function Preparing({
  token,
  onReady,
  onFailed,
}: {
  token: string;
  onReady: (url: string) => void;
  onFailed: () => void;
}) {
  const t = useTranslations("Platform");

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const { data } = await api.GET("/api/v1/platform/signups/{token}/", {
          params: { path: { token } },
        });
        if (stopped) return;
        if (data?.status === "ready" && data.url) return onReady(data.url);
        if (data?.status === "failed") return onFailed();
      } catch {
        // Internet uzilishi: keyingi urinishda davom etadi.
      }
      if (!stopped) timer = globalThis.setTimeout(poll, POLL_MS);
    }

    void poll();
    return () => {
      stopped = true;
      globalThis.clearTimeout(timer);
    };
  }, [token, onReady, onFailed]);

  return (
    <div className="pf-wait" role="status">
      <svg aria-hidden viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="30" pathLength={1} />
      </svg>
      <h1>{t("preparingTitle")}</h1>
      <p className="pf-sheet__text">{t("preparingText")}</p>
    </div>
  );
}
