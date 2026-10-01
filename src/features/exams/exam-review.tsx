import { Check, X } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { asDraft, describe } from "@/features/quiz/logic";
import type { components } from "@/lib/api/schema";

type Test = components["schemas"]["ExamTest"];

/**
 * Imtihon yopilgach: har savol bo'yicha javobingiz, to'g'ri javob va izoh (server komponenti —
 * interaktivlik yo'q). Xatolar birinchi, keyin to'g'rilari.
 */
export async function ExamReview({ test }: { test: Test }) {
  const [t, q] = await Promise.all([getTranslations("Exams"), getTranslations("LessonQuiz")]);
  const items = new Map(test.review.map((item) => [item.question, item]));
  const questions = test.review_questions.filter((question) => items.has(question.id));
  const wrong = questions.filter((question) => !items.get(question.id)?.correct);
  const right = questions.length - wrong.length;

  return (
    <details className="exam-review" open={wrong.length > 0}>
      <summary>
        {t("reviewTitle")}{" "}
        <span className="text-muted-foreground">
          {t("reviewCount", { right, total: questions.length })}
        </span>
      </summary>
      <ol>
        {[...wrong, ...questions.filter((question) => !wrong.includes(question))].map(
          (question) => {
            const item = items.get(question.id);
            if (!item) return null;
            const yours = describe(question, asDraft(item.response)).filter(Boolean);
            return (
              <li key={question.id} data-correct={item.correct ? "" : undefined}>
                <p className="exam-review__question">
                  {item.correct ? (
                    <Check aria-hidden className="size-4 shrink-0" />
                  ) : (
                    <X aria-hidden className="size-4 shrink-0" />
                  )}
                  <span className="sr-only">{item.correct ? q("right") : q("wrong")}</span>
                  {question.text}
                </p>
                {question.code && (
                  <pre className="quiz-code" data-language={question.language || undefined}>
                    <code>{question.code}</code>
                  </pre>
                )}
                <p className="quiz-mistakes__label">{q("yourAnswerWas")}</p>
                <ul data-kind="yours">
                  {yours.length ? (
                    yours.map((line) => <li key={line}>{line}</li>)
                  ) : (
                    <li>{q("noAnswer")}</li>
                  )}
                </ul>
                {!item.correct && (
                  <>
                    <p className="quiz-mistakes__label">{q(`correct.${question.kind}`)}</p>
                    <ul>
                      {describe(question, asDraft(item.correct_answer ?? {})).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </>
                )}
                {item.explanation && <p className="quiz-mistakes__text">{item.explanation}</p>}
              </li>
            );
          },
        )}
      </ol>
    </details>
  );
}
