import { readApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/schema";

type Schemas = components["schemas"];

export type Question = Schemas["QuizQuestion"];
export type Attempt = Schemas["QuizAttempt"];
export type Result = Schemas["QuizResult"];
export type Finish = Schemas["QuizFinish"];
export type Summary = Schemas["QuizSummary"];
export type Option = Schemas["QuizOption"];

/**
 * O'quvchi javobi — API formatida. Variant ID si — shu urinishda ekrandagi o'rni (1 dan):
 * baza ID lari brauzerga bermaydi, aks holda ular to'g'ri javobni ochib qo'yardi.
 */
export type Draft = {
  choice?: number;
  choices?: number[];
  text?: string;
  order?: number[];
  pairs?: Record<string, number>;
};

/** Savol ochilganda: tartiblashda — berilgan (aralash) tartib, qolganida — bo'sh. */
export function emptyDraft(question: Question): Draft {
  switch (question.kind) {
    case "MULTIPLE":
      return { choices: [] };
    case "TEXT":
      return { text: "" };
    case "ORDER":
      return { order: question.items.map((item) => item.id) };
    case "MATCH":
      return { pairs: {} };
    default:
      return {};
  }
}

/** "Tekshirish" tugmasi qachon ochiladi. */
export function isReady(question: Question, draft: Draft): boolean {
  switch (question.kind) {
    case "SINGLE":
      return draft.choice !== undefined;
    case "MULTIPLE":
      return (draft.choices?.length ?? 0) > 0;
    case "TEXT":
      return (draft.text ?? "").trim() !== "";
    case "ORDER":
      return (draft.order?.length ?? 0) === question.items.length;
    case "MATCH":
      return Object.keys(draft.pairs ?? {}).length === question.left.length;
  }
}

export function toggle(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

/** Tartiblash: elementni bir pog'ona yuqoriga (-1) yoki pastga (+1) suradi. */
export function move(list: number[], index: number, delta: -1 | 1): number[] {
  const target = index + delta;
  if (index < 0 || target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Moslashtirish: chapdagiga o'ngdagini biriktiradi. O'ngdagi band bo'lsa — eskisidan olinadi. */
export function pair(
  pairs: Record<string, number>,
  left: number,
  right: number,
): Record<string, number> {
  const next = Object.fromEntries(
    Object.entries(pairs).filter(([key, value]) => key !== String(left) && value !== right),
  );
  next[String(left)] = right;
  return next;
}

export function unpair(pairs: Record<string, number>, left: number): Record<string, number> {
  return Object.fromEntries(Object.entries(pairs).filter(([key]) => key !== String(left)));
}

/** API dan kelgan javob (`{[key]: unknown}`) — kutilgan maydonlarigina olinadi. */
export function asDraft(value: Record<string, unknown>): Draft {
  const numbers = (item: unknown) =>
    Array.isArray(item) ? item.filter((entry): entry is number => typeof entry === "number") : [];
  const draft: Draft = {};
  if (typeof value.choice === "number") draft.choice = value.choice;
  if (Array.isArray(value.choices)) draft.choices = numbers(value.choices);
  if (typeof value.text === "string") draft.text = value.text;
  if (Array.isArray(value.order)) draft.order = numbers(value.order);
  if (value.pairs && typeof value.pairs === "object" && !Array.isArray(value.pairs)) {
    draft.pairs = Object.fromEntries(
      Object.entries(value.pairs).filter((entry): entry is [string, number] => {
        return typeof entry[1] === "number";
      }),
    );
  }
  return draft;
}

/** Tanlangan variantlar (bitta yoki bir nechta) — belgilash uchun. */
export function chosen(draft: Draft): number[] {
  if (draft.choices) return draft.choices;
  return draft.choice === undefined ? [] : [draft.choice];
}

function textOf(options: Option[], id: number | undefined): string {
  return options.find((option) => option.id === id)?.text ?? "—";
}

/** Javobni o'qiladigan qatorlarga aylantiradi: to'g'ri javobni va xatolarni ko'rsatish uchun. */
export function describe(question: Question, draft: Draft): string[] {
  switch (question.kind) {
    case "SINGLE":
    case "MULTIPLE": {
      const ids = chosen(draft);
      return question.options.filter((option) => ids.includes(option.id)).map((o) => o.text);
    }
    case "TEXT":
      return [draft.text ?? ""];
    case "ORDER":
      return (draft.order ?? []).map((id) => textOf(question.items, id));
    case "MATCH":
      return question.left.map(
        (left) => `${left.text} → ${textOf(question.right, draft.pairs?.[String(left.id)])}`,
      );
  }
}

/**
 * Javobdan keyin variant belgisi, to'g'ri javob hali yashirin bo'lganda (test o'tilmagan): faqat
 * tanlangan variant belgilanadi. Bir nechta javobli savolda xato bo'lsa, qaysi variant xatoligi
 * aytilmaydi — bu to'g'ri javobni ochib qo'yardi.
 */
export function optionMark(
  selected: boolean,
  verdict: boolean | null,
  multiple: boolean,
): "correct" | "wrong" | undefined {
  if (!selected || verdict === null) return undefined;
  if (verdict) return "correct";
  return multiple ? undefined : "wrong";
}

/** Oxirgi ketma-ket to'g'ri javoblar (savollar tartibida). */
export function streak(questions: Question[], results: Record<number, Result>): number {
  let count = 0;
  for (const question of questions) {
    const result = results[question.id];
    if (!result) break;
    count = result.correct ? count + 1 : 0;
  }
  return count;
}

/** Birinchi javobsiz savol (hammasiga javob berilgan bo'lsa — savollar soni). */
export function firstOpen(questions: Question[], results: Record<number, Result>): number {
  const index = questions.findIndex((question) => !results[question.id]);
  return index === -1 ? questions.length : index;
}

/**
 * Oylik imtihonda javob natijasiz saqlanadi (`{question, response}`): savol komponenti uchun
 * "natija" ko'rinishiga keltiriladi — to'g'ri/noto'g'ri belgisi ko'rsatilmaydi (`blind`).
 */
export function blindResult(saved: {
  question: number;
  response: Record<string, unknown>;
}): Result {
  return {
    question: saved.question,
    correct: false,
    response: saved.response,
    correct_answer: null,
    explanation: "",
  };
}

/** Backend xatosining o'quvchiga ko'rsatiladigan matni (masalan, "Bu savolga javob berilgan."). */
export function problemOf(body: unknown): string | null {
  const error = readApiError(body);
  return error?.fields?.non_field_errors?.[0] ?? (error?.message || null);
}
