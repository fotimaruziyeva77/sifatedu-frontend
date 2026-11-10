"use client";

import { Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormError } from "@/features/auth/fields";
import { api } from "@/lib/api/client";

import { useSave } from "./use-save";

const INPUT = "h-12 text-base md:text-base";
// Rang tanlanmagan bo'lsa, sayt standart rangda (globals.css: --primary).
const DEFAULT_COLOR = "#e31e24";

type Brand = { name: string; color: string; logo: string; logo_dark: string };

function saveBrand(body: FormData | Record<string, unknown>) {
  return api.PATCH("/api/v1/center/brand/", {
    body: body as never,
    ...(body instanceof FormData ? { bodySerializer: (value: unknown) => value } : {}),
  });
}

function LogoField({
  label,
  field,
  url,
  onSave,
  busy,
}: {
  label: string;
  field: "logo" | "logo_dark";
  url: string;
  onSave: (body: FormData | Record<string, unknown>) => void;
  busy: boolean;
}) {
  const t = useTranslations("CenterSettings");
  const input = useRef<HTMLInputElement>(null);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append(field, file);
    onSave(body);
    event.target.value = "";
  }

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap items-center gap-3">
        {url && (
          // Logo istalgan markaz manzilidan keladi: next/image bu manzillarni bilmaydi.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="h-12 w-auto max-w-40 rounded-md border object-contain p-1"
          />
        )}
        <Button
          type="button"
          variant="outline"
          className="gap-1.5 rounded-full"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          <Upload aria-hidden className="size-4" />
          {t("chooseImage")}
        </Button>
        {url && (
          <Button
            type="button"
            variant="ghost"
            className="gap-1.5 rounded-full text-muted-foreground"
            disabled={busy}
            onClick={() => onSave({ [field]: null })}
          >
            <Trash2 aria-hidden className="size-4" />
            {t("remove")}
          </Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-label={label}
        onChange={onChange}
      />
    </Field>
  );
}

/** Nom, logo va asosiy rang: darhol butun saytga va admin panelga ta'sir qiladi. */
export function BrandForm({ brand }: { brand: Brand }) {
  const t = useTranslations("CenterSettings");
  const { save, error, busy } = useSave();
  const [name, setName] = useState(brand.name);
  const [color, setColor] = useState(brand.color);

  function send(body: FormData | Record<string, unknown>) {
    void save(() => saveBrand(body));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    send({ name, color });
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="center-name">{t("name")}</FieldLabel>
          <Input
            id="center-name"
            className={INPUT}
            value={name}
            maxLength={200}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="center-color">{t("color")}</FieldLabel>
          <div className="flex items-center gap-3">
            <input
              id="center-color"
              type="color"
              className="size-12 cursor-pointer rounded-md border bg-transparent p-1"
              value={color || DEFAULT_COLOR}
              onChange={(event) => setColor(event.target.value)}
            />
            <span className="font-mono text-sm text-muted-foreground">{color || "—"}</span>
            {color && (
              <button
                type="button"
                className="text-sm underline-offset-4 hover:underline"
                onClick={() => setColor("")}
              >
                {t("resetColor")}
              </button>
            )}
          </div>
          <FieldDescription>{t("colorHint")}</FieldDescription>
        </Field>

        <LogoField label={t("logo")} field="logo" url={brand.logo} onSave={send} busy={busy} />
        <LogoField
          label={t("logoDark")}
          field="logo_dark"
          url={brand.logo_dark}
          onSave={send}
          busy={busy}
        />
        <p className="text-xs text-muted-foreground">{t("logoHint")}</p>

        <FormError message={error} />
        <Button type="submit" className="h-12 w-fit rounded-full px-6" disabled={busy}>
          {t("save")}
        </Button>
      </FieldGroup>
    </form>
  );
}
