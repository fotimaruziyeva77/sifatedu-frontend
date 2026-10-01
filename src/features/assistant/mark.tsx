import { cn } from "@/lib/utils";

/**
 * AI maslahatchi belgisi — brendning "nuqtalarni bog'lash" g'oyasi (sahifa loaderi bilan bir xil).
 * Javob yozilayotganda chiziqlar navbatma-navbat ulanadi: yozish nuqtalari o'rnida.
 */
export function AssistantMark({
  thinking = false,
  className,
}: {
  thinking?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 104"
      aria-hidden
      className={cn("assistant-mark", thinking && "is-thinking", className)}
    >
      <path className="assistant-mark__line" pathLength={1} d="M20 84 L60 20" />
      <path className="assistant-mark__line" pathLength={1} d="M60 20 L100 84" />
      <path className="assistant-mark__line" pathLength={1} d="M100 84 L20 84" />
      <circle className="assistant-mark__dot" cx="20" cy="84" r="12" />
      <circle className="assistant-mark__dot" cx="60" cy="20" r="12" />
      <circle className="assistant-mark__dot assistant-mark__dot--hot" cx="100" cy="84" r="12" />
    </svg>
  );
}
