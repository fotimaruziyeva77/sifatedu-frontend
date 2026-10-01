"use client";

import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

/** `when` — serverda formatlangan vaqt: brauzerlarning ICU'sida o'zbekcha oy nomlari yo'q. */
export type NotificationItem = components["schemas"]["Notification"] & { when: string };

/**
 * Xabarlar ro'yxati. Sahifa ochilganda hammasi o'qilgan deb belgilanadi va menyudagi son
 * yangilanadi; bu safar yangi bo'lganlari esa sahifadan chiqquncha ajralib turadi.
 */
export function NotificationList({ items }: { items: NotificationItem[] }) {
  const t = useTranslations("Notifications");
  const router = useRouter();
  const [fresh] = useState(
    () => new Set(items.filter((item) => !item.read_at).map((item) => item.id)),
  );

  useEffect(() => {
    if (fresh.size === 0) return;
    api
      .POST("/api/v1/notifications/read/", { body: {} })
      .then(() => router.refresh())
      .catch(() => {
        // Tarmoq bo'lmasa, keyingi safar belgilanadi.
      });
  }, [fresh, router]);

  return (
    <ol className="note-list">
      {items.map((item) => {
        const isNew = fresh.has(item.id);
        return (
          <li key={item.id} className="note" data-new={isNew || undefined}>
            <div className="note__head">
              <h2 className="note__title">
                {isNew && <span className="sr-only">{t("new")}: </span>}
                {item.title}
              </h2>
              <time className="note__time" dateTime={item.created_at}>
                {item.when}
              </time>
            </div>
            {item.body && <p className="note__body">{item.body}</p>}
            {item.link && <NoteLink href={item.link} label={t("open")} />}
          </li>
        );
      })}
    </ol>
  );
}

function NoteLink({ href, label }: { href: string; label: string }) {
  // Sayt ichidagi yo'l — til prefiksi bilan; tashqi (Meet, Zoom) — yangi oynada.
  if (href.startsWith("/")) {
    return (
      <Link href={href} className="note__link">
        {label}
        <ArrowUpRight aria-hidden className="size-4" />
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="note__link">
      {label}
      <ArrowUpRight aria-hidden className="size-4" />
    </a>
  );
}
