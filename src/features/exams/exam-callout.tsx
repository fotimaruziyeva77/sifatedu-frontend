import { ArrowRight, Trophy } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { ExamCard } from "@/lib/api/exams";

/** Imtihonda hali qiladigan ish bor: test ishlanmagan yoki topshiriq yuborilmagan. */
export function needsWork(exam: ExamCard): boolean {
  return (
    exam.state === "OPEN" &&
    exam.can_take &&
    (!exam.test.finished || exam.tasks_submitted < exam.tasks_total)
  );
}

/** Kabinet bosh sahifasida: ochiq oylik imtihon (eng birinchisi) — muddati bilan. */
export async function ExamCallout({ exam }: { exam: ExamCard }) {
  const [t, format] = await Promise.all([getTranslations("Exams"), getFormatter()]);
  const until = format.dateTime(new Date(exam.closes_at), {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section aria-labelledby="exam-callout" className="app-card exam-callout mt-8">
      <span aria-hidden className="exam-callout__icon">
        <Trophy className="size-5" />
      </span>
      <div className="min-w-0">
        <h2 id="exam-callout" className="app-section-title">
          {t("callout.title", { course: exam.course_title })}
        </h2>
        <p className="mt-1 text-pretty text-muted-foreground">
          {t("callout.text", { date: until })}
        </p>
      </div>
      <Button asChild className="h-11 gap-2 rounded-full px-5">
        <Link href={`/dashboard/exams/${exam.id}`}>
          {t("callout.action")}
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </section>
  );
}
