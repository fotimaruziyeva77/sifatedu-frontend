import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Foydalanuvchi rasmi yoki ism-familiya bosh harflari (brend gradient halqasi bilan). */
export function UserAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src: string | null;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-grid size-9 shrink-0 place-items-center rounded-full bg-[conic-gradient(from_200deg,var(--caret),var(--track-default),var(--caret))] p-[2px]",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- ochiq S3 rasmi
        <img
          src={src}
          alt=""
          className="size-full rounded-full border-2 border-background object-cover"
        />
      ) : (
        <span className="grid size-full place-items-center rounded-full border-2 border-background bg-secondary font-display text-[0.7em] font-bold">
          {initials(name)}
        </span>
      )}
    </span>
  );
}
