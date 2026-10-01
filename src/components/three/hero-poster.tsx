import { CARET, LETTER_PATHS, LOGO_VIEWBOX } from "@/components/brand/logo-paths";
import { cn } from "@/lib/utils";

const LETTERS_D = Object.values(LETTER_PATHS).join(" ");

/**
 * 3D'gacha (va 3D o'chiq bo'lsa) ko'rinadigan poster: logo "nuqtalarni bog'lang" rasmi —
 * konturlar bo'ylab nuqtalar va ularni ulovchi ingichka chiziq. 3D sahna aynan shu kadrdan
 * boshlanadi, joylashuvi `heroFocus` nisbatlariga mos.
 */
export function HeroPoster({ className }: { className?: string }) {
  const { x, y, width, height } = LOGO_VIEWBOX;

  return (
    <div className={cn("absolute inset-0", className)}>
      <svg
        viewBox={`${x} ${y} ${width} ${height}`}
        overflow="visible"
        className="absolute top-1/2 left-1/2 w-[min(78vw,560px)] -translate-x-1/2 -translate-y-1/2 text-foreground lg:top-[47%] lg:left-[70%] lg:w-[min(40vw,620px)]"
      >
        <g fill="none" strokeLinejoin="round">
          <path d={LETTERS_D} stroke="var(--line)" strokeOpacity={0.4} strokeWidth={1.1} />
          <rect {...CARET} stroke="var(--caret)" strokeOpacity={0.55} strokeWidth={1.1} />
          <path
            d={LETTERS_D}
            stroke="currentColor"
            strokeOpacity={0.85}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeDasharray="0 17"
          />
          <rect
            {...CARET}
            stroke="var(--caret)"
            strokeWidth={5.5}
            strokeLinecap="round"
            strokeDasharray="0 17"
          />
        </g>
      </svg>
    </div>
  );
}
