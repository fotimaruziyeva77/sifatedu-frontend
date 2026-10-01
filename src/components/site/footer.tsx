import { ArrowUp } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/brand/logo";
import { CARET, LETTER_PATHS, LOGO_VIEWBOX } from "@/components/brand/logo-paths";
import { Link } from "@/i18n/navigation";
import type { SitePayload } from "@/lib/api/site";

import { CONTACT_SECTION, NAV_SECTIONS } from "./sections";

const SOCIAL_LABELS = {
  telegram: "Telegram",
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
} as const;

const LETTERS_D = Object.values(LETTER_PATHS).join(" ");

export async function SiteFooter({ site }: { site: SitePayload | null }) {
  const [t, tNav] = await Promise.all([getTranslations("Footer"), getTranslations("Nav")]);
  const settings = site?.settings;
  const socials = settings
    ? (Object.keys(SOCIAL_LABELS) as (keyof typeof SOCIAL_LABELS)[]).filter(
        (key) => settings.socials[key],
      )
    : [];
  const legalPages = site?.legal_pages ?? [];
  const { x, y, width, height } = LOGO_VIEWBOX;

  return (
    <footer data-play className="relative overflow-hidden border-t border-border">
      <div className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo className="h-5" />
            <p className="mt-6 font-display text-2xl leading-tight font-bold tracking-tight text-balance">
              {t("tagline")}
            </p>
            {settings && socials.length > 0 && (
              <ul aria-label={t("socials")} className="mt-6 flex flex-wrap gap-2">
                {socials.map((key) => (
                  <li key={key}>
                    <a
                      href={settings.socials[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-full border border-border px-3.5 py-1.5 text-sm transition-colors hover:border-foreground/30"
                    >
                      {SOCIAL_LABELS[key]}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <FooterColumn title={t("nav")}>
            {NAV_SECTIONS.map((id) => (
              <li key={id}>
                <Link href={{ pathname: "/", hash: id }}>{tNav(id)}</Link>
              </li>
            ))}
            <li>
              <Link href={{ pathname: "/", hash: CONTACT_SECTION }}>{tNav("cta")}</Link>
            </li>
          </FooterColumn>

          {settings && (settings.phone || settings.email || settings.address) && (
            <FooterColumn title={t("contacts")}>
              {settings.phone && (
                <li>
                  <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} className="font-mono">
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings.email && (
                <li>
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </li>
              )}
              {settings.address && <li className="text-muted-foreground">{settings.address}</li>}
              {settings.working_hours && (
                <li className="text-muted-foreground">{settings.working_hours}</li>
              )}
            </FooterColumn>
          )}

          {legalPages.length > 0 && (
            <FooterColumn title={t("legal")}>
              {legalPages.map((page) => (
                <li key={page.slug}>
                  <Link href={`/${page.slug}`}>{page.title}</Link>
                </li>
              ))}
            </FooterColumn>
          )}
        </div>

        {/* Katta kontur logo: nuqtalardan boshlangan hikoyaning yakuni. */}
        <svg
          aria-hidden
          viewBox={`${x} ${y} ${width} ${height}`}
          className="footer-wordmark mt-20 w-full"
        >
          <path d={LETTERS_D} fillRule="evenodd" />
          <rect {...CARET} className="footer-wordmark__caret" />
        </svg>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 font-mono text-xs text-muted-foreground sm:px-6">
          <span>{t("rights", { year: new Date().getFullYear() })}</span>
          <span>uz · ru · en</span>
          <a href="#main" className="inline-flex items-center gap-1.5 hover:text-foreground">
            {t("top")}
            <ArrowUp aria-hidden className="size-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="eyebrow mb-5">{title}</h2>
      <ul className="space-y-3 text-sm [&_a]:underline-offset-4 [&_a:hover]:underline">
        {children}
      </ul>
    </div>
  );
}
