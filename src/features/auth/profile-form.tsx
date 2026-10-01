"use client";

import { Trash2, Upload } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/site/user-avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";
import type { Me } from "@/lib/api/me";

import { FormError } from "./fields";

const LANGUAGE_LABELS: Record<string, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
};

/** Profil: ism, familiya, rasm va interfeys tili. */
export function ProfileForm({ me }: { me: Me }) {
  const t = useTranslations("Dashboard");
  const tAuth = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [avatar, setAvatar] = useState<string | null>(me.avatar ?? null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState({
    first_name: me.first_name ?? "",
    last_name: me.last_name ?? "",
    locale: me.locale ?? locale,
    audience: me.audience ?? "ADULT",
  });

  function afterSave(nextLocale?: string) {
    toast.success(t("saved"));
    startTransition(() => {
      // Til o'zgargan bo'lsa, manzil ham yangi tilga o'tadi.
      router.refresh();
      if (nextLocale && nextLocale !== locale) {
        router.replace("/dashboard/settings", { locale: nextLocale as "uz" | "ru" | "en" });
      }
    });
  }

  async function save(body: FormData | Record<string, unknown>, nextLocale?: string) {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const { data, error: failure } = await api.PATCH("/api/v1/me/", {
        body: body as never,
        ...(body instanceof FormData ? { bodySerializer: (value: unknown) => value } : {}),
      });
      if (data) {
        setAvatar(data.avatar ?? null);
        afterSave(nextLocale);
        return;
      }
      const parsed = readApiError(failure);
      const fields = Object.fromEntries(
        Object.entries(parsed?.fields ?? {}).map(([key, messages]) => [key, messages[0] ?? ""]),
      );
      setFieldErrors(fields);
      if (Object.keys(fields).length === 0) {
        setError(parsed?.message ?? tAuth("errors.server"));
      }
    } catch {
      setError(tAuth("errors.network"));
    } finally {
      setSaving(false);
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    void save(values, values.locale);
  }

  function onAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("avatar", file);
    void save(body);
    event.target.value = "";
  }

  const busy = saving || pending;

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <div className="flex flex-wrap items-center gap-5">
          <UserAvatar name={me.full_name || me.phone} src={avatar} className="size-20 text-3xl" />
          <div className="grid gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => fileInput.current?.click()}
                className="gap-1.5 rounded-full"
              >
                <Upload aria-hidden className="size-4" />
                {t("avatarChange")}
              </Button>
              {avatar && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => void save({ avatar: null })}
                  className="gap-1.5 rounded-full text-muted-foreground"
                >
                  <Trash2 aria-hidden className="size-4" />
                  {t("avatarRemove")}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t("avatarHint")}</p>
            {fieldErrors.avatar && (
              <p role="alert" className="text-sm text-destructive">
                {fieldErrors.avatar}
              </p>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onAvatarChange}
            className="sr-only"
            aria-label={t("avatar")}
          />
        </div>

        <Field data-invalid={Boolean(fieldErrors.first_name)}>
          <FieldLabel htmlFor="profile-first-name">{t("firstName")}</FieldLabel>
          <Input
            id="profile-first-name"
            value={values.first_name}
            onChange={(event) => setValues({ ...values, first_name: event.target.value })}
            aria-invalid={Boolean(fieldErrors.first_name)}
            className="h-12 text-base md:text-base"
          />
          <FieldError
            errors={[fieldErrors.first_name ? { message: fieldErrors.first_name } : undefined]}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="profile-last-name">{t("lastName")}</FieldLabel>
          <Input
            id="profile-last-name"
            value={values.last_name}
            onChange={(event) => setValues({ ...values, last_name: event.target.value })}
            className="h-12 text-base md:text-base"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="profile-phone">{t("phone")}</FieldLabel>
          <Input
            id="profile-phone"
            value={me.phone}
            readOnly
            disabled
            className="h-12 font-mono text-base md:text-base"
          />
          <FieldDescription>{t("phoneHint")}</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="profile-locale">{t("language")}</FieldLabel>
          <Select
            value={values.locale}
            onValueChange={(value) => setValues({ ...values, locale: value })}
          >
            <SelectTrigger
              id="profile-locale"
              className="w-full text-base data-[size=default]:h-12 md:text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {routing.locales.map((code) => (
                <SelectItem key={code} value={code}>
                  {LANGUAGE_LABELS[code]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* Ota-ona farzandi uchun SIFAT Kids kabinetini yoqadi (yoki aksincha). */}
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">{t("audience")}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["ADULT", "KIDS"] as const).map((value) => (
              <label key={value} className="audience-option">
                <input
                  type="radio"
                  name="audience"
                  value={value}
                  checked={values.audience === value}
                  onChange={() => setValues({ ...values, audience: value })}
                />
                <span>
                  <strong>{t(value === "ADULT" ? "audienceAdult" : "audienceKids")}</strong>
                  <em>{t(value === "ADULT" ? "audienceAdultHint" : "audienceKidsHint")}</em>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <FormError message={error} />
        <Button type="submit" disabled={busy} className="h-12 w-fit rounded-full px-6">
          {busy ? t("saving") : t("save")}
        </Button>
      </FieldGroup>
    </form>
  );
}
