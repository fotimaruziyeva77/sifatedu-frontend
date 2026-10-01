"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { selectCourseForLead } from "@/features/leads/select-course";

/**
 * Kursga yozilish. Hozircha ariza formasiga olib boradi va kursni oldindan tanlaydi;
 * to'lov 5-qadamda shu tugmaga ulanadi.
 */
export function EnrollButton({ slug, label }: { slug: string; label: string }) {
  const t = useTranslations("Course");

  return (
    <Button
      type="button"
      data-magnetic
      onClick={() => selectCourseForLead(slug)}
      className="h-13 w-full gap-2 rounded-full text-base shadow-[0_12px_32px_-14px_var(--caret)]"
      title={t("enrollHint")}
    >
      {label}
      <ArrowRight aria-hidden className="size-5" />
    </Button>
  );
}
