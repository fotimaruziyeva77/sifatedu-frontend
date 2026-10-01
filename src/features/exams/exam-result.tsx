import { getTranslations } from "next-intl/server";

import type { components } from "@/lib/api/schema";

type Outcome = components["schemas"]["ExamOutcome"];

/**
 * Imtihon natijasi: umumiy foiz (test va amaliy qism vazni bo'yicha), o'tdi/o'tmadi. Imtihon
 * yopilmagan yoki topshiriqlar baholanmagan bo'lsa — "hozircha" deb ko'rsatiladi.
 */
export async function ExamResult({
  result,
  passPercent,
}: {
  result: Outcome;
  passPercent: number;
}) {
  const t = await getTranslations("Exams");
  const verdict = !result.final ? "pending" : result.passed ? "passed" : "failed";

  return (
    <section aria-labelledby="exam-result" className="exam-result" data-verdict={verdict}>
      <div className="exam-result__total">
        <p id="exam-result" className="text-sm text-muted-foreground">
          {result.final ? t("resultFinal") : t("resultSoFar")}
        </p>
        <p className="exam-result__value">{result.total}%</p>
        <p className="exam-result__verdict">{t(`verdict.${verdict}`, { percent: passPercent })}</p>
      </div>
      <dl className="exam-result__parts">
        <div>
          <dt>{t("testTitle")}</dt>
          <dd>{result.test_score}%</dd>
        </div>
        <div>
          <dt>{t("practical")}</dt>
          <dd>{result.practical_score}%</dd>
        </div>
      </dl>
    </section>
  );
}
