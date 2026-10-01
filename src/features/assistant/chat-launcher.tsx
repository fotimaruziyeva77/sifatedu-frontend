"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { ChatPanel } from "./chat-panel";
import { AssistantMark } from "./mark";
import { chatStore, setChatOpen } from "./store";

/**
 * Har sahifada pastki o'ng burchakdagi tugma: AI maslahatchi oynasini ochadi (telefonda — to'liq
 * ekran). Kasb testi yonidagi chat ekranda ko'rinib turganda tugma yashiriladi.
 */
export function ChatLauncher() {
  const t = useTranslations("Assistant");
  const chat = useSyncExternalStore(
    chatStore.subscribe,
    chatStore.getSnapshot,
    chatStore.getServerSnapshot,
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Esc — yopish va fokusni tugmaga qaytarish.
  useEffect(() => {
    if (!chat.open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setChatOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [chat.open]);

  function close() {
    setChatOpen(false);
    buttonRef.current?.focus();
  }

  if (chat.inlineVisible && !chat.open) return null;

  return (
    <div className="chat-dock">
      {chat.open && (
        <div role="dialog" aria-label={t("title")} className="chat-dock__panel">
          <ChatPanel variant="floating" onClose={close} autoFocus />
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={chat.open}
        aria-label={chat.open ? t("close") : t("open")}
        onClick={() => setChatOpen(!chat.open)}
        className="chat-dock__button"
      >
        {chat.open ? (
          <X aria-hidden className="size-6" />
        ) : (
          <>
            <AssistantMark className="chat-dock__mark" />
            <span className="chat-dock__label">{t("launcher")}</span>
          </>
        )}
      </button>
    </div>
  );
}
