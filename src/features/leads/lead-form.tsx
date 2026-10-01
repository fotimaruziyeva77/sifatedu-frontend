"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import { formatPhoneInput, isCompletePhone } from "@/lib/phone";

import { onCourseSelected } from "./select-course";
import { captureUtm, readUtm } from "./utm";

const NO_COURSE = "none";
const SUCCESS_DOTS: [number, number][] = [
  [19, 33],
  [28, 42],
  [45, 23],
];

type CourseOption = { slug: string; title: string };

type LeadValues = {
  name: string;
  phone: string;
  course: string;
  comment: string;
  website: string;
};

type ServerFieldErrors = Partial<Record<keyof LeadValues, string[]>>;

function serverFieldErrors(body: unknown): ServerFieldErrors | null {
  if (typeof body !== "object" || body === null || !("error" in body)) return null;
  const error = (body as { error?: { fields?: unknown } }).error;
  return typeof error?.fields === "object" && error.fields !== null
    ? (error.fields as ServerFieldErrors)
    : null;
}

export function LeadForm({ courses }: { courses: readonly CourseOption[] }) {
  const t = useTranslations("Lead");
  const nameInput = useRef<HTMLInputElement | null>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const [submittedPhone, setSubmittedPhone] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t("errors.nameRequired"))
          .min(2, t("errors.nameShort"))
          .max(100),
        phone: z.string().refine(isCompletePhone, t("errors.phoneInvalid")),
        course: z.string(),
        comment: z.string().max(1000, t("errors.commentLong")),
        website: z.string(),
      }),
    [t],
  );

  const form = useForm<LeadValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      phone: "+998",
      course: NO_COURSE,
      comment: "",
      website: "",
    },
  });

  useEffect(() => {
    captureUtm();
    return onCourseSelected((slug) => {
      setSubmittedPhone(null);
      form.setValue("course", slug);
      nameInput.current?.focus({ preventScroll: true });
    });
  }, [form]);

  useEffect(() => {
    if (submittedPhone) successHeading.current?.focus();
  }, [submittedPhone]);

  async function onSubmit(values: LeadValues) {
    setFormError(null);
    try {
      const { response, error } = await api.POST("/api/v1/leads/", {
        body: {
          name: values.name,
          phone: values.phone,
          course: values.course === NO_COURSE ? null : values.course,
          comment: values.comment,
          website: values.website,
          source_page: window.location.pathname,
          ...readUtm(),
        },
      });

      if (response.status === 201) {
        setSubmittedPhone(values.phone);
        toast.success(t("successTitle"));
        form.reset();
        return;
      }
      if (response.status === 429) {
        setFormError(t("errors.rateLimited"));
        return;
      }
      const fields = response.status === 400 ? serverFieldErrors(error) : null;
      if (fields) {
        for (const [name, messages] of Object.entries(fields)) {
          if (name in values && messages?.length) {
            form.setError(
              name as keyof LeadValues,
              { message: messages[0] },
              { shouldFocus: true },
            );
          }
        }
        return;
      }
      setFormError(t("errors.server"));
    } catch {
      setFormError(t("errors.network"));
    }
  }

  if (submittedPhone) {
    return (
      <div role="status" className="flex flex-col items-start gap-4 py-6">
        {/* Nuqtalar ulanib, belgi bo'ladi: sayt g'oyasining yakuni. */}
        <svg viewBox="0 0 64 64" aria-hidden className="success-mark size-16">
          <circle cx="32" cy="32" r="29" pathLength={1} className="success-mark__ring" />
          <polyline points="19,33 28,42 45,23" pathLength={1} className="success-mark__check" />
          {SUCCESS_DOTS.map(([x, y], index) => (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3.4"
              className="success-mark__dot"
              style={{ "--i": index } as CSSProperties}
            />
          ))}
        </svg>
        <h3
          ref={successHeading}
          tabIndex={-1}
          className="font-display text-2xl font-bold tracking-tight outline-none"
        >
          {t("successTitle")}
        </h3>
        <p className="text-muted-foreground">{t("successText", { phone: submittedPhone })}</p>
        <Button variant="outline" className="rounded-full" onClick={() => setSubmittedPhone(null)}>
          {t("again")}
        </Button>
      </div>
    );
  }

  const { errors, isSubmitting } = form.formState;
  const nameField = form.register("name");

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="relative">
      <FieldGroup>
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="lead-name">{t("name")}</FieldLabel>
          <Input
            id="lead-name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            className="h-11"
            {...nameField}
            ref={(element) => {
              nameField.ref(element);
              nameInput.current = element;
            }}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Controller
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="lead-phone">{t("phone")}</FieldLabel>
              <Input
                id="lead-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={fieldState.invalid}
                className="h-11 font-mono"
                {...field}
                onChange={(event) => field.onChange(formatPhoneInput(event.target.value))}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        {courses.length > 0 && (
          <Controller
            control={form.control}
            name="course"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="lead-course">{t("course")}</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="lead-course"
                    className="w-full text-base data-[size=default]:h-11 md:text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_COURSE}>{t("courseNone")}</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.slug} value={course.slug}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        )}

        <Field data-invalid={Boolean(errors.comment)}>
          <FieldLabel htmlFor="lead-comment">{t("comment")}</FieldLabel>
          <Textarea
            id="lead-comment"
            rows={3}
            className="min-h-24"
            aria-invalid={Boolean(errors.comment)}
            aria-describedby="lead-comment-hint"
            {...form.register("comment")}
          />
          <FieldDescription id="lead-comment-hint">{t("commentHint")}</FieldDescription>
          <FieldError errors={[errors.comment]} />
        </Field>

        {/* Honeypot: odamlar ko'rmaydi, botlar to'ldiradi. */}
        <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" {...form.register("website")} />
          </label>
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {formError}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="h-13 w-full gap-2 rounded-full text-base shadow-[0_12px_32px_-14px_var(--caret)]"
        >
          {isSubmitting ? t("submitting") : t("submit")}
          {!isSubmitting && <ArrowRight aria-hidden className="size-5" />}
        </Button>

        <p className="text-xs text-pretty text-muted-foreground">
          {t.rich("consent", {
            link: (chunks) => (
              <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </FieldGroup>
    </form>
  );
}
