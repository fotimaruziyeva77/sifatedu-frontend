"use client";

import { useBrand } from "@/features/center/brand";
import { cn } from "@/lib/utils";

import { CARET, LETTER_PATHS, LOGO_VIEWBOX } from "./logo-paths";

const LETTERS_D = Object.values(LETTER_PATHS).join(" ");
const FONT_SIZE = 20;
// Taxminiy kenglik: SVG balandlik bo'yicha o'lchanadi, matn esa chegaradan chiqib ketishi mumkin.
const CHAR_WIDTH = 0.66 * FONT_SIZE;

type LogoProps = {
  className?: string;
  /** Qizil kursor muharrirdagidek miltillaydi. */
  blink?: boolean;
};

/** Markaz logosi: yuklangan rasm, bo'lmasa nomi. Birinchi markazda — «SIFAT» vektor logosi. */
export function Logo({ className, blink = false }: LogoProps) {
  const { name, logo, logoDark, flagship } = useBrand();

  if (logo) {
    // Rasm o'lchami noma'lum: balandlik qat'iy, eni rasmning o'ziga qarab.
    const image = "h-8 w-auto max-w-40 object-contain";
    return (
      <>
        {/* next/image har markaz manzilini oldindan bilishni talab qiladi. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={name} className={cn(image, logoDark && "dark:hidden")} />
        {logoDark && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoDark} alt={name} className={cn(image, "hidden dark:block")} />
        )}
      </>
    );
  }

  if (!flagship) {
    return (
      <svg
        viewBox={`0 0 ${Math.ceil(name.length * CHAR_WIDTH)} 24`}
        role="img"
        aria-label={name}
        className={cn("h-6 w-auto overflow-visible", className)}
      >
        <text
          x="0"
          y="19"
          fontSize={FONT_SIZE}
          fontWeight="700"
          className="fill-current font-display"
        >
          {name}
        </text>
      </svg>
    );
  }

  const { x, y, width, height } = LOGO_VIEWBOX;
  return (
    <svg
      viewBox={`${x} ${y} ${width} ${height}`}
      role="img"
      aria-label={name}
      className={cn("h-6 w-auto", className)}
    >
      <rect {...CARET} className={cn("fill-caret", blink && "animate-caret")} />
      <path d={LETTERS_D} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
