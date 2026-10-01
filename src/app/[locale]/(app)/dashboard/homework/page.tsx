import { ArrowRight, ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getMyHomework, type HomeworkItem } from "@/lib/api/homework";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/homework">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Homework" });
  return { title: t("pageTitle"), robots: { index: false } };
}

// Muhimi tepada: qaytarilganlar, keyin topshirilmaganlar, tekshirilayotganlar, qabul qilinganlar.
const GROUPS = ["CHANGES_REQUESTED", "NOT_SUBMITTED", "SUBMITTED", "ACCEPTED"] as const;
const statusKey = (status: HomeworkItem["status"]) => `status.${status}` as const;

/** O'quvchining uy vazifalari barcha kurslari bo'yicha. */
export default async function HomeworkPage({ params }: PageProps<"/[locale]/dashboard/homework">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, format, items] = await Promise.all([
    getTranslations("Homework"),
    getFormatter(),
    getMyHomework(locale),
  ]);
  const byOrder = (a: HomeworkItem, b: HomeworkItem) =>
    a.course_title.localeCompare(b.course_title) || a.position - b.position;

  return (
    <>
      <header>
        <h1 className="app-title">{t("pageTitle")}</h1>
        <p className="mt-3 max-w-xl text-pretty text-muted-foreground">{t("pageIntro")}</p>
      </header>

      {items.length === 0 ? (
        <div className="app-empty mt-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-caret">
            <ClipboardList aria-hidden className="size-6" />
          </span>
          <p className="max-w-lg text-pretty text-muted-foreground">{t("pageEmpty")}</p>
        </div>
      ) : (
        GROUPS.map((group) => {
          const rows = items.filter((item) => item.status === group).sort(byOrder);
          if (rows.length === 0) return null;
          return (
            <section key={group} aria-labelledby={`hw-${group}`} className="mt-8">
              <h2 id={`hw-${group}`} className="app-section-title">
                {t(`groups.${group}`)} <span className="text-muted-foreground">{rows.length}</span>
              </h2>
              <ul className="hw-list mt-4">
                {rows.map((item) => (
                  <li key={item.assignment_id}>
                    <Link
                      href={`/dashboard/courses/${item.course_slug}/lessons/${item.lesson_id}#homework`}
                      className="hw-row"
                    >
                      <span className="min-w-0">
                        <span className="hw-row__course">
                          {item.course_title} · {item.lesson_title}
                        </span>
                        <span className="hw-row__title">{item.title}</span>
                      </span>
                      <span className="hw-row__side">
                        <span className="hw-status" data-status={item.status}>
                          {item.status === "ACCEPTED" && item.score !== null
                            ? t("acceptedScore", { score: item.score })
                            : t(statusKey(item.status))}
                        </span>
                        {item.deadline && item.status === "NOT_SUBMITTED" && (
                          <span className="text-xs text-muted-foreground">
                            {t("deadline", {
                              date: format.dateTime(new Date(item.deadline), {
                                day: "numeric",
                                month: "long",
                              }),
                            })}
                          </span>
                        )}
                      </span>
                      <ArrowRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </>
  );
}
