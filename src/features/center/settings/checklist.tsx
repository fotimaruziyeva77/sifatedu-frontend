import { Check, Circle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { CenterSetup } from "@/lib/api/center-setup-types";

type Item = { key: string; label: string; done: boolean; action?: { href: string; label: string } };

export function setupItems(
  setup: CenterSetup,
  t: Awaited<ReturnType<typeof getTranslations<"CenterSettings">>>,
): Item[] {
  return [
    { key: "brand", label: t("todoBrand"), done: setup.steps.brand },
    {
      key: "course",
      label: t("todoCourse"),
      done: setup.steps.course,
      action: { href: setup.admin.course_add, label: t("addCourse") },
    },
    {
      key: "group",
      label: t("todoGroup"),
      done: setup.steps.group,
      action: { href: setup.admin.group_add, label: t("addGroup") },
    },
    {
      key: "legal",
      label: t("todoLegal"),
      done: setup.steps.legal,
      action: { href: setup.admin.legal, label: t("addLegal") },
    },
    ...(setup.telegram.available
      ? [{ key: "telegram", label: t("todoTelegram"), done: setup.telegram.connected }]
      : []),
    ...(setup.click.available
      ? [{ key: "click", label: t("todoClick"), done: setup.click.connected }]
      : []),
  ];
}

/** Nima qilindi va nima qoldi: holat saqlanmaydi, haqiqiy ma'lumotlardan hisoblanadi. */
export async function SetupChecklist({ setup }: { setup: CenterSetup }) {
  const t = await getTranslations("CenterSettings");

  return (
    <ul className="grid gap-3">
      {setupItems(setup, t).map((item) => (
        <li key={item.key} className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {item.done ? (
            <Check aria-hidden className="size-5 text-primary" />
          ) : (
            <Circle aria-hidden className="size-5 text-muted-foreground" />
          )}
          <span className={item.done ? "text-muted-foreground" : undefined}>
            {item.label}
            <span className="sr-only"> — {item.done ? t("done") : t("notDone")}</span>
          </span>
          {item.action && !item.done && (
            // Admin panel — Next.js'dan tashqarida, shuning uchun oddiy havola.
            <a href={item.action.href} className="text-sm font-medium underline underline-offset-4">
              {item.action.label}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
