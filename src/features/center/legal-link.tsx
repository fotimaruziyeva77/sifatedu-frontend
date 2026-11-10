"use client";

import type { ReactNode } from "react";

import { useBrand } from "@/features/center/brand";
import { Link } from "@/i18n/navigation";

/** Hujjatga havola: yangi markaz hujjatni hali yozmagan bo'lsa — oddiy matn (404 ochilmasin). */
export function LegalLink({
  page,
  className,
  children,
}: {
  page: "offer" | "privacy" | "refund-policy";
  className?: string;
  children: ReactNode;
}) {
  const { legal } = useBrand();
  if (!legal.includes(page)) return <>{children}</>;
  return (
    <Link href={`/${page}`} className={className}>
      {children}
    </Link>
  );
}
