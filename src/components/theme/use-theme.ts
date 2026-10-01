"use client";

import { useSyncExternalStore } from "react";

import { readTheme, type Theme } from "./theme";

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

/**
 * Joriy tema (`<html>` klassidan). Serverda tema noma'lum: gidratsiya "dark" bilan boshlanadi,
 * so'ng React haqiqiy qiymatga o'tadi (xato bermaydi).
 */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, readTheme, () => "dark");
}
