import { describe as group, expect, it } from "vitest";

import {
  asDraft,
  describe,
  emptyDraft,
  firstOpen,
  isReady,
  move,
  optionMark,
  pair,
  problemOf,
  streak,
  toggle,
  unpair,
  type Question,
  type Result,
} from "./logic";

function question(kind: Question["kind"], extra: Partial<Question> = {}): Question {
  return {
    id: 10,
    kind,
    text: "?",
    code: "",
    language: "",
    options: [],
    items: [],
    left: [],
    right: [],
    ...extra,
  };
}

const options = [
  { id: 1, text: "HTML" },
  { id: 2, text: "CSS" },
  { id: 3, text: "JS" },
];

function result(id: number, correct: boolean): Result {
  return { question: id, correct, response: {}, correct_answer: {}, explanation: "" };
}

group("javob tayyorligi", () => {
  it("tartiblash berilgan tartibdan boshlanadi va darhol tekshirsa bo'ladi", () => {
    const order = question("ORDER", { items: options });
    expect(emptyDraft(order)).toEqual({ order: [1, 2, 3] });
    expect(isReady(order, emptyDraft(order))).toBe(true);
  });

  it("bo'sh javob bilan tekshirib bo'lmaydi", () => {
    expect(isReady(question("SINGLE"), {})).toBe(false);
    expect(isReady(question("MULTIPLE"), { choices: [] })).toBe(false);
    expect(isReady(question("TEXT"), { text: "   " })).toBe(false);
    expect(isReady(question("TEXT"), { text: "h1" })).toBe(true);
  });

  it("moslashtirishda hamma juft kerak", () => {
    const match = question("MATCH", { left: options.slice(0, 2), right: options.slice(0, 2) });
    expect(isReady(match, { pairs: { "1": 2 } })).toBe(false);
    expect(isReady(match, { pairs: { "1": 2, "2": 1 } })).toBe(true);
  });
});

group("harakatlar", () => {
  it("belgilash qo'shadi va olib tashlaydi", () => {
    expect(toggle([1], 2)).toEqual([1, 2]);
    expect(toggle([1, 2], 1)).toEqual([2]);
  });

  it("tartibda chekkadan chiqib ketmaydi", () => {
    expect(move([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
    expect(move([1, 2, 3], 2, -1)).toEqual([1, 3, 2]);
    expect(move([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
    expect(move([1, 2, 3], 2, 1)).toEqual([1, 2, 3]);
  });

  it("band o'ng element yangi juftga o'tadi", () => {
    expect(pair({ "1": 5 }, 2, 5)).toEqual({ "2": 5 });
    expect(pair({ "1": 5, "2": 6 }, 1, 6)).toEqual({ "1": 6 });
    expect(unpair({ "1": 5, "2": 6 }, 1)).toEqual({ "2": 6 });
  });
});

group("natijalar", () => {
  const questions = [1, 2, 3, 4].map((id) => question("SINGLE", { id }));

  it("ketma-ket to'g'ri javoblar xatodan keyin qaytadan sanaladi", () => {
    const results = { 1: result(1, true), 2: result(2, false), 3: result(3, true) };
    expect(streak(questions, results)).toBe(1);
    expect(streak(questions, { 1: result(1, true), 2: result(2, true) })).toBe(2);
  });

  it("davom ettirish birinchi javobsiz savoldan", () => {
    expect(firstOpen(questions, { 1: result(1, true) })).toBe(1);
    const all = Object.fromEntries(questions.map((item) => [item.id, result(item.id, true)]));
    expect(firstOpen(questions, all)).toBe(4);
  });

  it("to'g'ri javob o'qiladigan qatorlarga aylanadi", () => {
    const match = question("MATCH", {
      left: [
        { id: 1, text: "HTML" },
        { id: 2, text: "CSS" },
      ],
      right: [
        { id: 1, text: "ko'rinish" },
        { id: 2, text: "tuzilma" },
      ],
    });
    expect(describe(match, { pairs: { "1": 2, "2": 1 } })).toEqual([
      "HTML → tuzilma",
      "CSS → ko'rinish",
    ]);
    expect(describe(question("ORDER", { items: options }), { order: [3, 1, 2] })).toEqual([
      "JS",
      "HTML",
      "CSS",
    ]);
    expect(describe(question("SINGLE", { options }), { choices: [2] })).toEqual(["CSS"]);
  });

  it("API dan kelgan javobdan faqat kutilgan maydonlar olinadi", () => {
    expect(asDraft({ choices: [1, "x", 2], pairs: { "1": 2, "2": "y" }, extra: 1 })).toEqual({
      choices: [1, 2],
      pairs: { "1": 2 },
    });
  });

  it("backend xatosining matni", () => {
    const body = {
      error: {
        code: "invalid",
        message: "Ma'lumotlarda xatolik bor.",
        fields: { non_field_errors: ["Bu savolga javob berilgan."] },
      },
    };
    expect(problemOf(body)).toBe("Bu savolga javob berilgan.");
    expect(problemOf({ error: { code: "x", message: "Topilmadi." } })).toBe("Topilmadi.");
    expect(problemOf("boshqa")).toBeNull();
  });
});

group("to'g'ri javob yashirin (test o'tilmagan)", () => {
  it("bitta javobda tanlangan variant to'g'ri yoki xato deb belgilanadi", () => {
    expect(optionMark(true, true, false)).toBe("correct");
    expect(optionMark(true, false, false)).toBe("wrong");
    expect(optionMark(false, false, false)).toBeUndefined();
  });

  it("bir nechta javobda xato bo'lsa qaysi variant xatoligi aytilmaydi", () => {
    expect(optionMark(true, true, true)).toBe("correct");
    expect(optionMark(true, false, true)).toBeUndefined();
  });

  it("javob berilmaguncha belgi yo'q", () => {
    expect(optionMark(true, null, false)).toBeUndefined();
  });
});
