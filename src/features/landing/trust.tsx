import { ArrowUpRight, type LucideIcon, PhoneCall, RotateCcw, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createElement } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "@/i18n/navigation";
import type { SitePayload } from "@/lib/api/site";

import { delay, SectionHeading } from "./section";

type Guarantee = { icon: LucideIcon; title: string; text: string; link?: string };

/** E'tirozlarga javob: kafolatlar va ko'p beriladigan savollar. */
export async function Trust({ site }: { site: SitePayload }) {
  const t = await getTranslations("Trust");
  const hasRefundPage = site.legal_pages.some((page) => page.slug === "refund-policy");

  const guarantees: Guarantee[] = [
    { icon: PhoneCall, title: t("consultTitle"), text: t("consultText") },
    { icon: ShieldCheck, title: t("paymentTitle"), text: t("paymentText") },
    {
      icon: RotateCcw,
      title: t("refundTitle"),
      text: t("refundText"),
      link: hasRefundPage ? t("refundLink") : undefined,
    },
  ];

  return (
    <section id="faq" aria-labelledby="faq-title" className="relative py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <SectionHeading
            id="faq-title"
            eyebrow={t("eyebrow")}
            title={t("title")}
            className="mb-10"
          />
          <ul className="grid gap-3">
            {guarantees.map((item, index) => (
              <li key={item.title} data-reveal style={delay(index * 90)} className="guarantee">
                <span aria-hidden className="guarantee__icon">
                  {createElement(item.icon, { className: "size-5" })}
                </span>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-pretty text-muted-foreground">{item.text}</p>
                  {item.link && (
                    <Link
                      href="/refund-policy"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
                    >
                      {item.link}
                      <ArrowUpRight aria-hidden className="size-3.5" />
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {site.faq.length > 0 && (
          <div data-reveal style={delay(120)}>
            <h3 className="eyebrow mb-4">{t("faqTitle")}</h3>
            <Accordion type="single" collapsible className="faq">
              {site.faq.map((item) => (
                <AccordionItem key={item.id} value={String(item.id)} className="faq__item">
                  <AccordionTrigger className="faq__trigger">{item.question}</AccordionTrigger>
                  <AccordionContent className="faq__answer">{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    </section>
  );
}
