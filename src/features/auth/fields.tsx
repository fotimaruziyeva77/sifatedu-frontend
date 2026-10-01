"use client";

import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { FieldError } from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError as FieldErrorText,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const INPUT = "h-12 text-base md:text-base";

type BaseProps = {
  id: string;
  label: string;
  error?: FieldError;
  hint?: string;
};

export function PhoneInput({
  id,
  label,
  error,
  hint,
  value,
  onChange,
  autoFocus,
  disabled,
}: BaseProps & {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        autoFocus={autoFocus}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={cn(INPUT, "font-mono")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldErrorText errors={[error]} />
    </Field>
  );
}

export function PasswordInput({
  id,
  label,
  error,
  hint,
  autoComplete = "current-password",
  ...field
}: BaseProps & Omit<React.ComponentProps<"input">, "id" | "type" | "className">) {
  const t = useTranslations("Auth");
  const [visible, setVisible] = useState(false);

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className={cn(INPUT, "pr-12")}
          {...field}
        />
        <button
          type="button"
          onClick={() => setVisible((shown) => !shown)}
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          {visible ? (
            <EyeOff aria-hidden className="size-4.5" />
          ) : (
            <Eye aria-hidden className="size-4.5" />
          )}
        </button>
      </div>
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldErrorText errors={[error]} />
    </Field>
  );
}

export function CodeInput({
  id,
  label,
  error,
  hint,
  ...field
}: BaseProps & Omit<React.ComponentProps<"input">, "id" | "type" | "className">) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        // Telefon SMS'dagi kodni o'zi taklif qiladi.
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        aria-invalid={Boolean(error)}
        className={cn(INPUT, "text-center font-mono text-xl tracking-[0.5em]")}
        {...field}
      />
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldErrorText errors={[error]} />
    </Field>
  );
}

/** Formani to'sib turadigan umumiy xato (masalan, "telefon yoki parol noto'g'ri"). */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="auth-error">
      {message}
    </p>
  );
}

/** Aksiya va yangiliklarga rozilik: ixtiyoriy, oldindan belgilanmagan (TZ 4.12). */
export function MarketingConsent({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const t = useTranslations("Auth");
  return (
    <label className="auth-check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{t("marketingConsent")}</span>
    </label>
  );
}
