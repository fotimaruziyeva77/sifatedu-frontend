"use client";

import { useEffect, useRef } from "react";

import { ChatPanel } from "./chat-panel";
import { setInlineVisible } from "./store";

/** Kasb testi yonidagi chat. Ko'rinib turganda suzuvchi tugma kerak emas (bitta suhbat). */
export function InlineChat() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInlineVisible(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      setInlineVisible(false);
    };
  }, []);

  return (
    <div ref={ref} data-reveal className="chat-inline">
      <ChatPanel variant="inline" />
    </div>
  );
}
