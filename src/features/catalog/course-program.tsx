import { Lock, Play } from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { CourseModule } from "@/lib/api/catalog";

function moduleLength(module: CourseModule): number {
  return module.lessons.reduce((total, lesson) => total + lesson.duration_min, 0);
}

/** Kurs dasturi: modullar akkordeoni, ichida darslar. Bepul darslar belgilanadi. */
export async function CourseProgram({ modules }: { modules: readonly CourseModule[] }) {
  const t = await getTranslations("Course");
  if (modules.length === 0) return null;

  return (
    <Accordion type="multiple" defaultValue={[String(modules[0].id)]} className="program">
      {modules.map((module, index) => (
        <AccordionItem key={module.id} value={String(module.id)} className="program__item">
          <AccordionTrigger className="program__trigger">
            <span className="program__index" aria-hidden>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="flex-1 text-left">
              <span className="block font-semibold">{module.title}</span>
              <span className="program__meta">
                {t("lessonCount", { count: module.lessons.length })} ·{" "}
                {t("minutes", { count: moduleLength(module) })}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="program__content">
            <ul>
              {module.lessons.map((lesson) => (
                <li key={lesson.id} className="program__lesson">
                  <span aria-hidden className="program__icon">
                    {lesson.is_preview ? (
                      <Play className="size-3.5 fill-current" />
                    ) : (
                      <Lock className="size-3.5" />
                    )}
                  </span>
                  <span className="flex-1">
                    {lesson.title}
                    {lesson.is_preview && <span className="program__free">{t("free")}</span>}
                  </span>
                  <span className="program__duration">
                    {t("minutes", { count: lesson.duration_min })}
                  </span>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
