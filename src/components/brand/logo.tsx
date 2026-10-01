import { cn } from "@/lib/utils";

import { CARET, LETTER_PATHS, LOGO_VIEWBOX } from "./logo-paths";

const LETTERS_D = Object.values(LETTER_PATHS).join(" ");

type LogoProps = {
  className?: string;
  /** Qizil kursor muharrirdagidek miltillaydi. */
  blink?: boolean;
  title?: string;
};

/** "SIFAT" wordmark: harflar `currentColor`, kursor brend qizilida. */
export function Logo({ className, blink = false, title = "Sifat Edu" }: LogoProps) {
  const { x, y, width, height } = LOGO_VIEWBOX;

  return (
    <svg
      viewBox={`${x} ${y} ${width} ${height}`}
      role="img"
      aria-label={title}
      className={cn("h-6 w-auto", className)}
    >
      <rect {...CARET} className={cn("fill-caret", blink && "animate-caret")} />
      <path d={LETTERS_D} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
