import { ArrowRight } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { TeacherExam } from "@/lib/api/exams";

/**
 * Baholovchi uchun imtihonlar (o'qituvchi, admin, menejer): holati, test ishlaganlar va
 * baholanmagan javoblar. «Guruhlar» va «Oylik imtihonlar» sahifalarida.
 */
export async function TeacherExamList({ exams }: { exams: TeacherExam[] }) {
  const [e, format] = await Promise.all([getTranslations("TeacherExams"), getFormatter()]);

  return (
    <ul className="exam-list mt-5">
      {exams.map((exam) => (
        <li key={exam.id}>
          <article className="exam-card" aria-labelledby={`teacher-exam-${exam.id}`}>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                {format.dateTime(new Date(exam.month), { month: "long", year: "numeric" })}
              </p>
              <h3 id={`teacher-exam-${exam.id}`} className="exam-card__title">
                <Link href={`/dashboard/teaching/exams/${exam.id}`} className="teach-card__link">
                  {exam.course_title}
                </Link>
              </h3>
              <ul className="teach-chips mt-3">
                <li className="exam-chip" data-state={exam.status}>
                  {e(exam.status === "DRAFT" ? "draft" : "ready")}
                </li>
                <li className="teach-chip">
                  {e("testedCount", { tested: exam.tested, students: exam.students })}
                </li>
                {exam.to_grade > 0 && (
                  <li className="exam-chip" data-state="todo">
                    {e("toGradeCount", { count: exam.to_grade })}
                  </li>
                )}
              </ul>
            </div>
            <ArrowRight aria-hidden className="exam-card__arrow size-5" />
          </article>
        </li>
      ))}
    </ul>
  );
}
