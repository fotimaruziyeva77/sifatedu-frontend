"use client";

import { ArrowRight, ArrowUp, Check, RotateCcw, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { type Priced, priceLines } from "@/features/catalog/price";
import { NamedIcon } from "@/features/landing/icons";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { AssistantMark } from "./mark";
import { type Inline, parseRichText } from "./rich-text";
import {
  type ChatCard,
  type ChatError,
  type ChatMessage,
  chatStore,
  dismissError,
  loadChat,
  rateMessage,
  resetChat,
  sendMessage,
} from "./store";

import "./assistant.css";

const SUGGESTIONS = ["suggestFit", "suggestPrice", "suggestKids", "suggestOffline"] as const;
const ERRORS: Record<ChatError, string> = {
  busy: "errorBusy",
  network: "errorNetwork",
  timeout: "errorTimeout",
  disabled: "errorDisabled",
  limit: "errorLimit",
};

/**
 * AI maslahatchi bilan suhbat. Ikki joyda ishlatiladi: kasb testi yonida (`inline`) va har
 * sahifadagi suzuvchi oynada (`floating`) — ikkalasi bitta suhbatni ko'rsatadi (store.ts).
 */
export function ChatPanel({
  variant,
  onClose,
  autoFocus = false,
}: {
  variant: "inline" | "floating";
  onClose?: () => void;
  autoFocus?: boolean;
}) {
  const t = useTranslations("Assistant");
  const chat = useSyncExternalStore(
    chatStore.subscribe,
    chatStore.getSnapshot,
    chatStore.getServerSnapshot,
  );
  const [text, setText] = useState("");
  const titleId = useId();
  const inputId = useId();
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = chat.sending || Boolean(chat.conversation?.pending);
  const Heading = variant === "inline" ? "h3" : "h2";

  useEffect(() => {
    void loadChat();
  }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Yangi xabar yoki yozilayotgan matn — pastga.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [chat.messages.length, chat.draft, busy]);

  async function submit(value: string) {
    if (await sendMessage(value)) setText("");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(text);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter — yuborish, Shift+Enter — yangi qator (IME bilan yozayotganda emas).
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit(text);
    }
  }

  const quizTrack = chat.quiz?.track;
  const showSuggestions = chat.phase === "ready" && chat.messages.length === 0;

  return (
    <section aria-labelledby={titleId} className={cn("chat", `chat--${variant}`)}>
      <header className="chat__head">
        <span className="chat__avatar">
          <AssistantMark thinking={busy} />
        </span>
        <div className="min-w-0">
          <Heading id={titleId} className="chat__title">
            {t("title")}
          </Heading>
          <p className="chat__status">
            <span aria-hidden className="chat__online" />
            {t("status")}
          </p>
        </div>
        <div className="chat__tools">
          {chat.messages.length > 0 && (
            <button
              type="button"
              onClick={() => void resetChat()}
              className="chat__icon-btn"
              aria-label={t("newChat")}
              title={t("newChat")}
            >
              <RotateCcw aria-hidden className="size-4" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="chat__icon-btn"
              aria-label={t("close")}
              title={t("close")}
            >
              <X aria-hidden className="size-5" />
            </button>
          )}
        </div>
      </header>

      <div ref={logRef} role="log" aria-labelledby={titleId} className="chat__log">
        <div className="chat__row is-ai">
          <div className="chat__bubble">{t("greeting")}</div>
        </div>
        {chat.messages.map((message) => (
          <MessageRow key={message.id} message={message} />
        ))}
        {busy && (
          <div aria-hidden className="chat__row is-ai">
            <div className="chat__bubble is-draft">
              {chat.draft ? (
                <RichText text={chat.draft} />
              ) : (
                <AssistantMark thinking className="chat__typing" />
              )}
            </div>
          </div>
        )}
      </div>
      <p role="status" className="sr-only">
        {busy ? t("typing") : ""}
      </p>

      <div className="chat__footer">
        {(showSuggestions || (quizTrack && !busy)) && (
          <div className="chat__chips">
            {quizTrack && (
              <button
                type="button"
                className="chat__chip is-quiz"
                onClick={() => void sendMessage(t("quizMessage", { track: quizTrack }), chat.quiz)}
              >
                {t("quizChip", { track: quizTrack })}
              </button>
            )}
            {showSuggestions &&
              SUGGESTIONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="chat__chip"
                  onClick={() => void sendMessage(t(key))}
                >
                  {t(key)}
                </button>
              ))}
          </div>
        )}

        {chat.conversation?.has_lead && (
          <p className="chat__lead">
            <Check aria-hidden className="size-4" />
            {t("leadSent")}
          </p>
        )}

        {chat.error && (
          <div role="alert" className="chat__alert">
            <span>{t(ERRORS[chat.error])}</span>
            <button
              type="button"
              onClick={dismissError}
              className="chat__icon-btn"
              aria-label={t("dismiss")}
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        )}

        <form onSubmit={onSubmit} className="chat__form">
          <label htmlFor={inputId} className="sr-only">
            {t("placeholder")}
          </label>
          <textarea
            id={inputId}
            ref={inputRef}
            rows={1}
            value={text}
            maxLength={1000}
            enterKeyHint="send"
            placeholder={t("placeholder")}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={onKeyDown}
            className="chat__input"
          />
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="chat__send"
            aria-label={t("send")}
          >
            <ArrowUp aria-hidden className="size-5" />
          </button>
        </form>
        <p className="chat__note">
          {t.rich("disclaimer", {
            link: (chunks) => <Link href="/privacy">{chunks}</Link>,
          })}
        </p>
      </div>
    </section>
  );
}

function MessageRow({ message }: { message: ChatMessage }) {
  const t = useTranslations("Assistant");
  const mine = message.role === "user";
  const saved = message.id > 0;

  return (
    <div className={cn("chat__row", mine ? "is-user" : "is-ai")}>
      <span className="sr-only">{mine ? t("you") : t("ai")}:</span>
      {message.text && (
        <div className="chat__bubble">{mine ? message.text : <RichText text={message.text} />}</div>
      )}
      {message.attachments.length > 0 && (
        <div className="chat__cards">
          {message.attachments.map((card) => (
            <CourseLink key={card.slug} card={card} />
          ))}
        </div>
      )}
      {!mine && saved && (
        <div className="chat__rate">
          <button
            type="button"
            aria-pressed={message.rating === 1}
            aria-label={t("rateUp")}
            title={t("rateUp")}
            onClick={() => void rateMessage(message.id, 1)}
          >
            <ThumbsUp aria-hidden className="size-3.5" />
          </button>
          <button
            type="button"
            aria-pressed={message.rating === -1}
            aria-label={t("rateDown")}
            title={t("rateDown")}
            onClick={() => void rateMessage(message.id, -1)}
          >
            <ThumbsDown aria-hidden className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function CourseLink({ card }: { card: ChatCard }) {
  const t = useTranslations("Courses");
  const locale = useLocale();
  const [price] = priceLines(
    { ...card, study_format: card.study_format as Priced["study_format"] },
    locale,
    {
      free: t("free"),
      price: (value) => t("price", { price: value }),
      once: t("once"),
      monthly: t("monthly"),
    },
  );

  return (
    <Link href={`/courses/${card.slug}`} className="chat-card">
      <span aria-hidden className="chat-card__icon">
        <NamedIcon name={card.icon} className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="chat-card__title">{card.title}</span>
        <span className="chat-card__price">
          {price.amount}
          {price.unit && ` · ${price.unit}`}
        </span>
      </span>
      <ArrowRight aria-hidden className="size-4 shrink-0" />
    </Link>
  );
}

function InlineParts({ parts }: { parts: Inline[] }) {
  return parts.map((part, index) =>
    part.type === "link" ? (
      <a key={index} href={part.href} target="_blank" rel="noopener noreferrer nofollow">
        {part.href.replace(/^https:\/\//, "")}
      </a>
    ) : part.type === "bold" ? (
      <strong key={index}>{part.value}</strong>
    ) : (
      <span key={index}>{part.value}</span>
    ),
  );
}

function RichText({ text }: { text: string }) {
  return parseRichText(text).map((block, index) =>
    block.type === "list" ? (
      <ul key={index}>
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>
            <InlineParts parts={item} />
          </li>
        ))}
      </ul>
    ) : (
      <p key={index}>
        {block.lines.map((line, lineIndex) => (
          <span key={lineIndex} className="block">
            <InlineParts parts={line} />
          </span>
        ))}
      </p>
    ),
  );
}
