"use client";

import { ArrowDown, ArrowRight, ArrowUp, Check, CheckCheck, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";

import {
  asDraft,
  blindResult,
  chosen,
  describe,
  emptyDraft,
  isReady,
  move,
  optionMark,
  pair,
  problemOf,
  toggle,
  unpair,
  type Draft,
  type Question,
  type Result,
} from "./logic";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Bitta savol: javob berish, "Tekshirish", keyin darhol to'g'ri yoki noto'g'riligi. To'g'ri javob
 * va izoh backend'dan faqat test o'tilgach keladi (yakundagi "xatolar ustida ishlash"da).
 * Har savol alohida komponent (`key` — savol ID si): yangi savolda holat o'zi tozalanadi.
 *
 * `blind` — oylik imtihon (`true`) yoki kunlik test (`"daily"`): javob "Saqlash" bilan
 * yuboriladi va natijasi aytilmaydi (test yopilgach ko'rsatiladi). `onSkip` — savolni keyinga
 * qoldirish.
 */
export function QuizStep({
  attemptId,
  question,
  result,
  last,
  blind = false,
  onAnswered,
  onNext,
  onSkip,
}: {
  attemptId: number;
  question: Question;
  result: Result | undefined;
  last: boolean;
  blind?: boolean | "daily";
  onAnswered: (result: Result) => void;
  onNext: () => void;
  onSkip?: () => void;
}) {
  const t = useTranslations("LessonQuiz");
  const ids = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const [draft, setDraft] = useState<Draft>(() =>
    result ? asDraft(result.response) : emptyDraft(question),
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  // Yangi savol ochilganda fokus savolga o'tadi: ekran o'quvchi ham shu yerdan o'qiydi.
  useEffect(() => heading.current?.focus(), []);
  useEffect(() => {
    if (result) next.current?.focus();
  }, [result]);

  async function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (result || sending || !isReady(question, draft)) return;
    setSending(true);
    setError(null);
    try {
      const { data, failure } = await send();
      if (data) onAnswered(data);
      else setError(problemOf(failure) ?? t("errors.server"));
    } catch {
      setError(t("errors.network"));
    } finally {
      setSending(false);
    }
  }

  async function send(): Promise<{ data: Result | null; failure: unknown }> {
    const request = {
      params: { path: { id: attemptId } },
      body: { question: question.id, response: draft },
    };
    if (blind === "daily") {
      const { data, error: failure } = await api.POST(
        "/api/v1/daily-test/attempts/{id}/answers/",
        request,
      );
      return { data: data ? blindResult(data) : null, failure };
    }
    if (blind) {
      const { data, error: failure } = await api.POST(
        "/api/v1/exam-attempts/{id}/answers/",
        request,
      );
      return { data: data ? blindResult(data) : null, failure };
    }
    const { data, error: failure } = await api.POST("/api/v1/quiz-attempts/{id}/answers/", request);
    return { data: data ?? null, failure };
  }

  const correct = result?.correct_answer ? asDraft(result.correct_answer) : null;
  // Imtihonda javob berilgach ham to'g'ri/noto'g'ri belgisi yo'q.
  const verdict = result && !blind ? result.correct : null;
  const locked = Boolean(result) || sending;

  return (
    <form className="quiz-step" onSubmit={(event) => void check(event)} noValidate>
      <h3 ref={heading} tabIndex={-1} className="quiz-question">
        {question.text}
      </h3>
      {question.code && (
        <pre className="quiz-code" data-language={question.language || undefined}>
          <code>{question.code}</code>
        </pre>
      )}
      <p id={`${ids}-hint`} className="quiz-hint">
        {t(`kind.${question.kind}`)}
      </p>

      {(question.kind === "SINGLE" || question.kind === "MULTIPLE") && (
        <Choices
          question={question}
          draft={draft}
          correct={correct}
          verdict={verdict}
          locked={locked}
          hint={`${ids}-hint`}
          onChange={setDraft}
        />
      )}
      {question.kind === "TEXT" && (
        <input
          aria-label={t("yourAnswer")}
          aria-describedby={`${ids}-hint`}
          className="quiz-input"
          data-state={verdict === null ? undefined : verdict ? "correct" : "wrong"}
          value={draft.text ?? ""}
          onChange={(event) => setDraft({ text: event.target.value })}
          readOnly={locked}
          maxLength={500}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      )}
      {question.kind === "ORDER" && (
        <Order
          question={question}
          draft={draft}
          correct={correct}
          locked={locked}
          onChange={setDraft}
          onAnnounce={setAnnounce}
        />
      )}
      {question.kind === "MATCH" && (
        <Match
          question={question}
          draft={draft}
          correct={correct}
          locked={locked}
          onChange={setDraft}
          onAnnounce={setAnnounce}
        />
      )}

      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      <div aria-live="polite">
        {result && blind && (
          <div className="quiz-feedback" data-saved="">
            <p className="quiz-feedback__title">
              <CheckCheck aria-hidden className="size-5" />
              {t("saved")}
            </p>
            <p className="quiz-feedback__text">
              {t(blind === "daily" ? "savedHintDaily" : "savedHint")}
            </p>
          </div>
        )}
        {result && !blind && (
          <div className="quiz-feedback" data-correct={result.correct ? "" : undefined}>
            <p className="quiz-feedback__title">
              {result.correct ? (
                <Check aria-hidden className="size-5" />
              ) : (
                <X aria-hidden className="size-5" />
              )}
              {result.correct ? t("right") : t("wrong")}
            </p>
            {!result.correct &&
              correct &&
              question.kind !== "SINGLE" &&
              question.kind !== "MULTIPLE" && (
                <div className="quiz-feedback__answer">
                  <p>{t(`correct.${question.kind}`)}</p>
                  <ul>
                    {describe(question, correct).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
            {!result.correct && !correct && (
              <p className="quiz-feedback__text">{t("revealLater")}</p>
            )}
            {result.explanation && <p className="quiz-feedback__text">{result.explanation}</p>}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="quiz-error">
          {error}
        </p>
      )}

      <div className="quiz-actions">
        {result ? (
          <Button
            ref={next}
            type="button"
            onClick={onNext}
            className="h-11 gap-2 rounded-full px-5 text-base"
          >
            {last ? t("finish") : t("next")}
            <ArrowRight aria-hidden className="size-4" />
          </Button>
        ) : (
          <>
            <Button
              type="submit"
              disabled={sending || !isReady(question, draft)}
              className="h-11 gap-2 rounded-full px-5 text-base"
            >
              {sending && <Loader2 aria-hidden className="size-4 animate-spin" />}
              {blind ? t("save") : t("check")}
            </Button>
            {onSkip && (
              <Button
                type="button"
                variant="ghost"
                onClick={onSkip}
                disabled={sending}
                className="h-11 rounded-full px-4"
              >
                {t("skip")}
              </Button>
            )}
          </>
        )}
      </div>
    </form>
  );
}

/** Tanlash: bitta javob — radio, bir nechta — belgilash katakchalari. */
function Choices({
  question,
  draft,
  correct,
  verdict,
  locked,
  hint,
  onChange,
}: {
  question: Question;
  draft: Draft;
  correct: Draft | null;
  verdict: boolean | null;
  locked: boolean;
  hint: string;
  onChange: (draft: Draft) => void;
}) {
  const t = useTranslations("LessonQuiz");
  const name = useId();
  const multiple = question.kind === "MULTIPLE";
  const picked = chosen(draft);
  const right = correct ? chosen(correct) : [];

  return (
    <fieldset className="quiz-options" aria-describedby={hint} disabled={locked}>
      <legend className="sr-only">{question.text}</legend>
      {question.options.map((option, index) => {
        const selected = picked.includes(option.id);
        const state = !correct
          ? optionMark(selected, verdict, multiple)
          : right.includes(option.id)
            ? "correct"
            : selected
              ? "wrong"
              : undefined;
        return (
          <label
            key={option.id}
            className="quiz-option"
            data-state={state}
            data-picked={selected ? "" : undefined}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={name}
              checked={selected}
              onChange={() =>
                onChange(
                  multiple
                    ? { choices: toggle(draft.choices ?? [], option.id) }
                    : { choice: option.id },
                )
              }
            />
            <span aria-hidden className="quiz-option__key">
              {LETTERS[index]}
            </span>
            <span className="quiz-option__text">{option.text}</span>
            {state === "correct" && (
              <span className="quiz-option__mark">
                <Check aria-hidden className="size-4" />
                <span className="sr-only">{t("correctMark")}</span>
              </span>
            )}
            {state === "wrong" && (
              <span className="quiz-option__mark">
                <X aria-hidden className="size-4" />
                <span className="sr-only">{t("wrongMark")}</span>
              </span>
            )}
          </label>
        );
      })}
    </fieldset>
  );
}

/** Tartiblash: ↑/↓ tugmalari (klaviatura va telefonda ham qulay). */
function Order({
  question,
  draft,
  correct,
  locked,
  onChange,
  onAnnounce,
}: {
  question: Question;
  draft: Draft;
  correct: Draft | null;
  locked: boolean;
  onChange: (draft: Draft) => void;
  onAnnounce: (text: string) => void;
}) {
  const t = useTranslations("LessonQuiz");
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const order = draft.order ?? [];
  const textOf = (id: number) => question.items.find((item) => item.id === id)?.text ?? "";

  function shift(index: number, delta: -1 | 1) {
    const id = order[index];
    const next = move(order, index, delta);
    onChange({ order: next });
    const position = index + delta;
    onAnnounce(t("moved", { text: textOf(id), position: position + 1 }));
    // Element ko'chgach fokus o'sha tugmada qoladi (chekkada bo'lsa — qarama-qarshisida).
    const edge = position === 0 || position === order.length - 1;
    const direction = edge ? (delta < 0 ? "down" : "up") : delta < 0 ? "up" : "down";
    requestAnimationFrame(() => buttons.current.get(`${id}-${direction}`)?.focus());
  }

  return (
    <ol className="quiz-order">
      {order.map((id, index) => {
        const text = textOf(id);
        const state = !correct ? undefined : correct.order?.[index] === id ? "correct" : "wrong";
        return (
          <li key={id} className="quiz-order__item" data-state={state}>
            <span aria-hidden className="quiz-order__number">
              {index + 1}
            </span>
            <span className="quiz-order__text">{text}</span>
            <span className="quiz-order__moves">
              <button
                ref={(node) => {
                  if (node) buttons.current.set(`${id}-up`, node);
                }}
                type="button"
                className="quiz-move"
                aria-label={t("moveUp", { text })}
                disabled={locked || index === 0}
                onClick={() => shift(index, -1)}
              >
                <ArrowUp aria-hidden className="size-4" />
              </button>
              <button
                ref={(node) => {
                  if (node) buttons.current.set(`${id}-down`, node);
                }}
                type="button"
                className="quiz-move"
                aria-label={t("moveDown", { text })}
                disabled={locked || index === order.length - 1}
                onClick={() => shift(index, 1)}
              >
                <ArrowDown aria-hidden className="size-4" />
              </button>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Moslashtirish: chapdagini tanlang (u belgilanadi), so'ng o'ngdagi juftini bosing. Juftlar bir
 * xil harf bilan ko'rinadi; keyingi juftsiz element o'zi tanlanadi. Juftni bekor qilish —
 * o'ngdagini qayta bosish.
 */
function Match({
  question,
  draft,
  correct,
  locked,
  onChange,
  onAnnounce,
}: {
  question: Question;
  draft: Draft;
  correct: Draft | null;
  locked: boolean;
  onChange: (draft: Draft) => void;
  onAnnounce: (text: string) => void;
}) {
  const t = useTranslations("LessonQuiz");
  const pairs = draft.pairs ?? {};
  const [selected, setSelected] = useState<number | null>(question.left[0]?.id ?? null);
  const letterOf = (leftId: number) =>
    LETTERS[question.left.findIndex((item) => item.id === leftId)] ?? "";
  const ownerOf = (rightId: number) => {
    const entry = Object.entries(pairs).find(([, value]) => value === rightId);
    return entry ? Number(entry[0]) : null;
  };

  function chooseRight(rightId: number, text: string) {
    if (selected === null) {
      const owner = ownerOf(rightId);
      if (owner === null) return;
      onChange({ pairs: unpair(pairs, owner) });
      setSelected(owner);
      onAnnounce(
        t("unpaired", { text: question.left.find((item) => item.id === owner)?.text ?? "" }),
      );
      return;
    }
    const next = pair(pairs, selected, rightId);
    onChange({ pairs: next });
    const left = question.left.find((item) => item.id === selected)?.text ?? "";
    onAnnounce(t("paired", { left, right: text }));
    setSelected(question.left.find((item) => next[String(item.id)] === undefined)?.id ?? null);
  }

  return (
    <div className="quiz-match">
      <ul className="quiz-match__column" aria-label={t("matchLeft")}>
        {question.left.map((item, index) => {
          const partner = pairs[String(item.id)];
          const state = !correct
            ? undefined
            : correct.pairs?.[String(item.id)] === partner
              ? "correct"
              : "wrong";
          const partnerText = question.right.find((right) => right.id === partner)?.text;
          return (
            <li key={item.id}>
              <button
                type="button"
                className="quiz-tile"
                data-state={state}
                data-paired={partner !== undefined ? "" : undefined}
                aria-pressed={selected === item.id}
                disabled={locked}
                onClick={() => setSelected(selected === item.id ? null : item.id)}
              >
                <span aria-hidden className="quiz-tile__key" data-pair={index % 6}>
                  {LETTERS[index]}
                </span>
                <span className="quiz-tile__text">{item.text}</span>
                {partnerText && <span className="sr-only">— {partnerText}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <ul className="quiz-match__column" aria-label={t("matchRight")}>
        {question.right.map((item) => {
          const owner = ownerOf(item.id);
          const index = owner === null ? -1 : question.left.findIndex((left) => left.id === owner);
          return (
            <li key={item.id}>
              <button
                type="button"
                className="quiz-tile"
                data-paired={owner !== null ? "" : undefined}
                disabled={locked}
                onClick={() => chooseRight(item.id, item.text)}
              >
                <span
                  aria-hidden
                  className="quiz-tile__key"
                  data-pair={index >= 0 ? index % 6 : undefined}
                >
                  {owner !== null ? letterOf(owner) : ""}
                </span>
                <span className="quiz-tile__text">{item.text}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
