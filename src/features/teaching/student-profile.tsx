"use client";

import { Camera, Loader2, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import { readApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/schema";

import { StudentAvatar } from "./student-avatar";

type Student = Pick<
  components["schemas"]["TeacherStudent"],
  "id" | "name" | "first_name" | "last_name" | "middle_name" | "birth_date" | "avatar"
>;
type Values = { first_name: string; last_name: string; middle_name: string; birth_date: string };

const MAX_MB = 10;
const FIELDS = [
  ["last_name", "profileLastName"],
  ["first_name", "profileFirstName"],
  ["middle_name", "profileMiddleName"],
] as const;

function valuesOf(student: Student): Values {
  return {
    first_name: student.first_name,
    last_name: student.last_name,
    middle_name: student.middle_name,
    birth_date: student.birth_date ?? "",
  };
}

/**
 * O'quvchi profilini tuzatish (yon panel): familiya, ism, otasining ismi, tug'ilgan sana va
 * rasm. O'quvchi botda kiritgan ma'lumot ham shu yerda to'g'rilanadi; saqlangach ism tasdiqlangan
 * hisoblanadi — botda qayta so'ralmaydi.
 */
export function EditStudent({ groupId, student }: { groupId: number; student: Student }) {
  const t = useTranslations("Teaching");
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Values>(() => valuesOf(student));
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);

  // Tanlangan rasmning oldindan ko'rinishi: almashganda yoki panel yopilganda xotiradan
  // bo'shatiladi.
  function choose(file: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  function toggle(next: boolean) {
    setOpen(next);
    choose(null);
    if (next) {
      setValues(valuesOf(student));
      setRemovePhoto(false);
      setErrors({});
      setProblem(null);
    }
  }

  function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setErrors({ ...errors, photo: t("profilePhotoTooBig", { mb: MAX_MB }) });
      return;
    }
    setErrors({ ...errors, photo: "" });
    choose(file);
    setRemovePhoto(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setProblem(null);
    const body = new FormData();
    for (const [key, value] of Object.entries(values)) body.append(key, value.trim());
    if (photo) body.append("photo", photo, photo.name);
    else if (removePhoto) body.append("remove_photo", "true");
    try {
      const { data, error } = await api.PATCH("/api/v1/teacher/groups/{id}/students/{user_id}/", {
        params: { path: { id: groupId, user_id: student.id } },
        body: body as never,
        bodySerializer: (value: unknown) => value,
      });
      if (data) {
        setOpen(false);
        router.refresh();
        return;
      }
      const parsed = readApiError(error);
      const fields = Object.fromEntries(
        Object.entries(parsed?.fields ?? {}).map(([key, messages]) => [key, messages[0] ?? ""]),
      );
      setErrors(fields);
      setProblem(
        fields.non_field_errors || (Object.keys(fields).length ? null : t("errors.server")),
      );
    } catch {
      setProblem(t("errors.network"));
    } finally {
      setBusy(false);
    }
  }

  const shown = removePhoto ? null : (preview ?? student.avatar);

  return (
    <Sheet open={open} onOpenChange={toggle}>
      <SheetTrigger asChild>
        <button type="button" className="roster-edit">
          <Pencil aria-hidden className="size-3.5" />
          {t("profileEdit")}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full! overflow-y-auto" closeLabel={t("cancel")}>
        <SheetHeader>
          <SheetTitle className="font-display text-lg font-bold">{t("profileTitle")}</SheetTitle>
          <SheetDescription>{t("profileHint")}</SheetDescription>
        </SheetHeader>
        <form className="sp-form" onSubmit={(event) => void submit(event)} noValidate>
          <div className="sp-photo">
            <StudentAvatar name={student.name} src={shown} className="sp-photo__image" />
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
                  <Camera aria-hidden className="size-4" />
                  {t("profilePhotoPick")}
                </Button>
                {shown && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      choose(null);
                      setRemovePhoto(true);
                    }}
                    className="gap-1.5 rounded-full text-muted-foreground"
                  >
                    <Trash2 aria-hidden className="size-4" />
                    {t("profilePhotoRemove")}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t("profilePhotoHint")}</p>
              {errors.photo && (
                <p role="alert" className="live-error">
                  {errors.photo}
                </p>
              )}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={pick}
              className="sr-only"
              aria-label={t("profilePhotoPick")}
            />
          </div>

          {FIELDS.map(([field, label]) => (
            <label key={field} className="hw-field">
              <span>{t(label)}</span>
              <input
                type="text"
                className="roster-input"
                value={values[field]}
                maxLength={150}
                autoComplete="off"
                aria-invalid={Boolean(errors[field])}
                onChange={(event) => setValues({ ...values, [field]: event.target.value })}
              />
              {errors[field] && (
                <span role="alert" className="live-error">
                  {errors[field]}
                </span>
              )}
            </label>
          ))}

          <label className="hw-field">
            <span>{t("profileBirthDate")}</span>
            <input
              type="date"
              className="roster-input"
              value={values.birth_date}
              min="1930-01-01"
              max={new Date().toISOString().slice(0, 10)}
              aria-invalid={Boolean(errors.birth_date)}
              onChange={(event) => setValues({ ...values, birth_date: event.target.value })}
            />
            {errors.birth_date && (
              <span role="alert" className="live-error">
                {errors.birth_date}
              </span>
            )}
          </label>

          {problem && (
            <p role="alert" className="live-error">
              {problem}
            </p>
          )}
          <div className="roster-actions">
            <Button type="submit" disabled={busy} className="h-11 gap-2 rounded-full px-5">
              {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
              {t("profileSave")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full px-5"
              onClick={() => toggle(false)}
            >
              {t("cancel")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
