import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

/** O'quvchi rasmi (selfi yoki o'qituvchi yuklagan surat) — bo'lmasa ism bosh harflari. */
export function StudentAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src: string | null | undefined;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- ochiq S3 rasmi, 512 px kvadrat
      <img
        src={src}
        alt=""
        loading="lazy"
        className={cn("teach-avatar teach-avatar--photo", className)}
      />
    );
  }
  return (
    <span aria-hidden className={cn("teach-avatar", className)}>
      {initials(name)}
    </span>
  );
}
