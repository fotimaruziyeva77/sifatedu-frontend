import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/** Kirish sahifalari uchun umumiy karta: sarlavha, izoh va mazmun. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="auth-card">
      <h1 className="auth-title">{title}</h1>
      {subtitle && <p className="auth-subtitle">{subtitle}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

/** Oferta va maxfiylik siyosatiga rozilik (ro'yxatdan o'tish va ijtimoiy kirishda). */
export async function TermsNote() {
  const t = await getTranslations("Auth");

  return (
    <p className="mt-6 text-center text-xs text-pretty text-muted-foreground">
      {t.rich("terms", {
        offer: (chunks) => (
          <Link href="/offer" className="underline underline-offset-4 hover:text-foreground">
            {chunks}
          </Link>
        ),
        privacy: (chunks) => (
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            {chunks}
          </Link>
        ),
      })}
    </p>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return <p className="auth-divider">{label}</p>;
}
