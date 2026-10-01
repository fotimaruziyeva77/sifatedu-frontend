"use client";

import { ArrowRight, CircleAlert, CircleCheck, Clock, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api/client";

/** Bank javobi kechikishi mumkin, shuning uchun holat qayta-qayta so'raladi. */
const POLL_MS = 3000;
const TRIES = 20;

type Order = {
  id: number;
  status: string;
  course_slug: string;
  course_title: string;
};

/**
 * To'lov natijasi. Holat **backend'dan** olinadi: Click sahifasidan qaytish
 * to'lovning isboti emas.
 */
export function PaymentResult({ orderId }: { orderId: number }) {
  const t = useTranslations("Payment");
  const [order, setOrder] = useState<Order | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    async function check() {
      const { data } = await api.GET("/api/v1/orders/{id}/", {
        params: { path: { id: orderId } },
      });
      if (stopped) return;
      if (data) setOrder(data as Order);
      tries += 1;
      if (data?.status === "NEW" && tries < TRIES) timer = setTimeout(check, POLL_MS);
      else setDone(true);
    }

    void check();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [orderId]);

  if (!order && !done) {
    return (
      <p className="payment-state">
        <Loader2 aria-hidden className="size-5 animate-spin" />
        {t("checking")}
      </p>
    );
  }

  if (!order) {
    return <p className="payment-state">{t("notFound")}</p>;
  }

  if (order.status === "PAID") {
    return (
      <Outcome
        tone="ok"
        icon={<CircleCheck aria-hidden className="size-7" />}
        title={t("paidTitle")}
        text={t("paidText", { course: order.course_title })}
      >
        <Button asChild className="h-11 gap-2 rounded-full px-5">
          <Link href={`/dashboard/courses/${order.course_slug}`}>
            {t("openCourse")}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </Outcome>
    );
  }

  if (order.status === "NEW") {
    return (
      <Outcome
        tone="wait"
        icon={<Clock aria-hidden className="size-7" />}
        title={t("pendingTitle")}
        text={t("pendingText")}
      >
        <Button asChild variant="outline" className="h-11 rounded-full px-5">
          <Link href="/dashboard/orders">{t("myOrders")}</Link>
        </Button>
      </Outcome>
    );
  }

  return (
    <Outcome
      tone="bad"
      icon={<CircleAlert aria-hidden className="size-7" />}
      title={t("failedTitle")}
      text={order.status === "EXPIRED" ? t("expiredText") : t("failedText")}
    >
      <Button asChild className="h-11 gap-2 rounded-full px-5">
        <Link href={`/courses/${order.course_slug}`}>
          {t("backToCourse")}
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </Outcome>
  );
}

function Outcome({
  tone,
  icon,
  title,
  text,
  children,
}: {
  tone: "ok" | "wait" | "bad";
  icon: React.ReactNode;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="payment-card" data-tone={tone}>
      <span className="payment-card__icon">{icon}</span>
      <h1 className="app-title text-[clamp(1.5rem,3vw,2rem)]">{title}</h1>
      <p className="max-w-md text-pretty text-muted-foreground">{text}</p>
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  );
}
