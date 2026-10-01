import { Fragment } from "react";

import { cn } from "@/lib/utils";

import "./heading.css";

/**
 * Matndagi `*so'z*` ajratib ko'rsatiladi: brend qizilida, ostida qo'lda chizilgandek chiziq.
 * Admin hero sarlavhasida shu belgidan foydalanadi. Yulduzcha juft bo'lmasa — oddiy matn.
 */
export function Emphasis({ text, className }: { text: string; className?: string }) {
  const parts = text.split("*");
  if (parts.length % 2 === 0) return <>{text.replaceAll("*", "")}</>;

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <em key={index} className={cn("em-mark", className)}>
            {part}
            <svg
              aria-hidden
              viewBox="0 0 120 12"
              preserveAspectRatio="none"
              className="em-mark__line"
            >
              <path d="M2 8.6c13-5.2 26-5.4 39-1.6s27 4.6 40 .4 26-6.2 37-2.6" />
            </svg>
          </em>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
