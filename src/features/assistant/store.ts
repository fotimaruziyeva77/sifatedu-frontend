import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type Schemas = components["schemas"];
export type ChatMessage = Schemas["ChatMessage"];
export type ChatCard = Schemas["ChatCard"];
export type ChatConversation = Schemas["ChatConversation"];
export type QuizContext = Schemas["QuizContextRequest"];
export type ChatError = "busy" | "network" | "timeout" | "disabled" | "limit";

export type ChatSnapshot = {
  phase: "idle" | "loading" | "ready";
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  /** Yozilayotgan javobning tayyor qismi (backend Redis'dan beradi). */
  draft: string;
  sending: boolean;
  error: ChatError | null;
  /** Kasb testi natijasi: keyingi xabar bilan birga AI'ga boradi. */
  quiz: QuizContext | null;
  /** Suzuvchi chat oynasi ochiqmi. */
  open: boolean;
  /** Kasb testi yonidagi chat ekranda ko'rinib turibdi — suzuvchi tugma yashiriladi. */
  inlineVisible: boolean;
};

const POLL_MS = 700;
/** Backend 90 soniyadan keyin javobni "yo'qolgan" deb hisoblaydi; biz biroz ko'proq kutamiz. */
const GIVE_UP_MS = 95_000;

const INITIAL: ChatSnapshot = {
  phase: "idle",
  conversation: null,
  messages: [],
  draft: "",
  sending: false,
  error: null,
  quiz: null,
  open: false,
  inlineVisible: false,
};

let state = INITIAL;
const listeners = new Set<() => void>();
let pollTimer: number | undefined;
let pollStarted = 0;

function set(patch: Partial<ChatSnapshot>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

/** `useSyncExternalStore` uchun: bir sahifadagi ikkala chat (test yonida va suzuvchi) bitta holatni ko'radi. */
export const chatStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => state,
  getServerSnapshot: () => INITIAL,
};

function merge(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.id - b.id);
}

function lastServerId(): number {
  return state.messages.reduce((max, message) => Math.max(max, message.id), 0);
}

function apply(data: Schemas["ChatState"], mode: "replace" | "merge") {
  const messages = mode === "merge" ? merge(state.messages, data.messages) : data.messages;
  set({ phase: "ready", conversation: data.conversation, messages, draft: data.draft });
  if (data.conversation?.pending) {
    schedulePoll();
  } else {
    stopPolling();
    // Backend kutishni to'xtatgan, lekin javob yo'q: worker ishlamay qolgan bo'lishi mumkin.
    if (messages.at(-1)?.role === "user" && data.conversation) set({ error: "timeout" });
  }
}

function stopPolling() {
  window.clearTimeout(pollTimer);
  pollTimer = undefined;
  pollStarted = 0;
}

function schedulePoll() {
  if (pollTimer !== undefined) return;
  if (!pollStarted) pollStarted = Date.now();
  pollTimer = window.setTimeout(async () => {
    pollTimer = undefined;
    const { data } = await api
      .GET("/api/v1/assistant/chat/", { params: { query: { after: lastServerId() } } })
      .catch(() => ({ data: undefined }));
    if (Date.now() - pollStarted > GIVE_UP_MS) {
      stopPolling();
      set({ draft: "", error: "timeout" });
      return;
    }
    if (data) apply(data, "merge");
    else schedulePoll();
  }, POLL_MS);
}

/** Birinchi ochilganda suhbat tarixi olinadi (cookie orqali, sahifalar almashganda ham saqlanadi). */
export async function loadChat() {
  if (state.phase !== "idle") return;
  set({ phase: "loading" });
  const { data } = await api.GET("/api/v1/assistant/chat/").catch(() => ({ data: undefined }));
  if (data) apply(data, "replace");
  else set({ phase: "ready" });
}

/** Xabar yuboradi. Muvaffaqiyatli bo'lsa `true` (maydon tozalanadi), aks holda matn qoladi. */
export async function sendMessage(text: string, quiz?: QuizContext | null): Promise<boolean> {
  const body = text.trim();
  if (!body || state.sending || state.conversation?.pending) return false;

  const temporary: ChatMessage = {
    id: -Date.now(),
    role: "user",
    text: body,
    attachments: [],
    rating: null,
    created_at: new Date().toISOString(),
  };
  set({ sending: true, error: null, messages: [...state.messages, temporary] });

  const context = quiz ?? state.quiz;
  const result = await api
    .POST("/api/v1/assistant/chat/", {
      body: { text: body, page: window.location.pathname, ...(context ? { quiz: context } : {}) },
    })
    .catch(() => null);

  if (result?.data) {
    set({ sending: false, quiz: context ? null : state.quiz });
    apply(result.data, "replace");
    return true;
  }
  const status = result?.response.status;
  set({
    sending: false,
    messages: state.messages.filter((message) => message.id !== temporary.id),
    error:
      status === 409 ? "busy" : status === 503 ? "disabled" : status === 429 ? "limit" : "network",
  });
  return false;
}

/** 👍 / 👎 — qayta bosilsa bekor qilinadi. */
export async function rateMessage(id: number, value: 1 | -1) {
  const current = state.messages.find((message) => message.id === id);
  const rating = current?.rating === value ? 0 : value;
  set({
    messages: state.messages.map((message) =>
      message.id === id ? { ...message, rating: rating || null } : message,
    ),
  });
  await api
    .POST("/api/v1/assistant/chat/rate/", { body: { message: id, rating } })
    .catch(() => null);
}

/** "Yangi suhbat": cookie o'chiriladi, eski suhbat menejerlar uchun saqlanib qoladi. */
export async function resetChat() {
  stopPolling();
  await api.DELETE("/api/v1/assistant/chat/").catch(() => null);
  set({ conversation: null, messages: [], draft: "", error: null, sending: false });
}

export function setQuizContext(quiz: QuizContext | null) {
  set({ quiz });
}

export function setChatOpen(open: boolean) {
  set({ open });
}

export function setInlineVisible(inlineVisible: boolean) {
  set({ inlineVisible });
}

export function dismissError() {
  set({ error: null });
}
