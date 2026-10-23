"use client";

import { useTranslations } from "next-intl";
import { Fragment, useLayoutEffect, useRef, type ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { slideFonts } from "@/fonts/slides";
import { cn } from "@/lib/utils";

import {
  type Block,
  type Card,
  type CodeBlock,
  type Inline,
  type ListBlock,
  type SlideData,
  type SlideKind,
  cardColumns,
  columnWeight,
  inlineText,
  isOutput,
  slideKind,
} from "./types";

/** Slaydning mantiqiy o'lchami: ekranga moslab kattalashtiriladi yoki kichraytiriladi. */
export const SLIDE_W = 1280;
export const SLIDE_H = 720;
const MIN_FIT = 0.55;
/** Raqamli kartalar («01 Dictionary») ranglari ketma-ketligi. */
const NUMBER_TONES = ["qizil", "sariq", "kok", "yashil"] as const;

type Context = {
  kind: SlideKind;
  card: boolean;
  column: boolean;
  labels: { from: string; end: string };
};

function inline(nodes: Inline[], key = ""): ReactNode {
  return nodes.map((node, index) => {
    const id = `${key}${index}`;
    switch (node[0]) {
      case "t":
        return <Fragment key={id}>{node[1]}</Fragment>;
      case "c":
        return <code key={id}>{node[1]}</code>;
      case "br":
        return <br key={id} />;
      case "b":
        return <strong key={id}>{inline(node[1], `${id}-`)}</strong>;
      case "i":
        return <em key={id}>{inline(node[1], `${id}-`)}</em>;
      case "s":
        return <s key={id}>{inline(node[1], `${id}-`)}</s>;
      case "a":
        return node[1] ? (
          <a key={id} href={node[1]} target="_blank" rel="noopener noreferrer">
            {inline(node[2], `${id}-`)}
          </a>
        ) : (
          <Fragment key={id}>{inline(node[2], `${id}-`)}</Fragment>
        );
      default:
        return null;
    }
  });
}

function list(item: ListBlock, key: string, className?: string): ReactNode {
  const items = item.items.map((entry, index) => (
    <li key={`${key}-${index}`}>
      {inline(entry.inl)}
      {entry.sub && list(entry.sub, `${key}-${index}`)}
    </li>
  ));
  return item.t === "ol" ? (
    <ol key={key} start={item.start} className={className}>
      {items}
    </ol>
  ) : (
    <ul key={key} className={className}>
      {items}
    </ul>
  );
}

function code(item: CodeBlock, key: string): ReactNode {
  const output = isOutput(item);
  return (
    <pre
      key={key}
      className={cn("slide-code", output && "slide-code--out")}
      data-lang={item.lang || undefined}
    >
      <code>
        {item.lines.map((line, row) => {
          const error = output && /\w*Error\b/.test(line.map(([, text]) => text).join(""));
          return (
            <span key={row} className={cn("slide-code__line", error && "slide-code__line--error")}>
              {line.length === 0
                ? "​"
                : line.map(([cls, text], k) =>
                    cls ? (
                      <span key={k} className={`tk-${cls}`}>
                        {text}
                      </span>
                    ) : (
                      <Fragment key={k}>{text}</Fragment>
                    ),
                  )}
            </span>
          );
        })}
      </code>
    </pre>
  );
}

function paragraph(nodes: Inline[], key: string, ctx: Context): ReactNode {
  // Muqova va bo'limda kod bilan boshlangan qator — «chip»lar: `[ "list" ]` `( "tuple", )` izoh
  if ((ctx.kind === "cover" || ctx.kind === "section") && !ctx.card && nodes[0]?.[0] === "c") {
    return (
      <p key={key} className="slide-chips">
        {nodes.map((node, index) => {
          if (node[0] === "c") {
            return (
              <code key={index} className="slide-chip">
                {node[1]}
              </code>
            );
          }
          const note = inlineText([node]).trim();
          return note ? (
            <span key={index} className="slide-chips__note">
              {note}
            </span>
          ) : null;
        })}
      </p>
    );
  }
  // Kartadagi yolg'iz kod — natija (viktorina javobi kabi)
  if (ctx.card && nodes.length === 1 && nodes[0][0] === "c") {
    return (
      <p key={key} className="slide-result">
        {nodes[0][1]}
      </p>
    );
  }
  return <p key={key}>{inline(nodes)}</p>;
}

function cards(items: Card[], key: string, ctx: Context): ReactNode {
  const columns = ctx.column ? 1 : cardColumns(items);
  const inner: Context = { ...ctx, card: true };
  return (
    <div
      key={key}
      className="slide-cards"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {items.map((card, index) => {
        const numberTone = card.tone || NUMBER_TONES[index % NUMBER_TONES.length];
        const titleTone = card.tone && !card.num ? `tone-${card.tone}` : undefined;
        return (
          <section key={index} className={cn("slide-card", card.label && "slide-card--label")}>
            {card.num && (
              <span className={cn("slide-card__num", `tone-${numberTone}`)}>{card.num}</span>
            )}
            {card.title.length > 0 &&
              (card.label ? (
                <h4 className={cn("slide-card__label", titleTone)}>{inline(card.title)}</h4>
              ) : (
                <h3 className={cn("slide-card__title", titleTone)}>{inline(card.title)}</h3>
              ))}
            {card.blocks.map((item, k) => block(item, `${key}-${index}-${k}`, inner))}
          </section>
        );
      })}
    </div>
  );
}

function block(item: Block, key: string, ctx: Context): ReactNode {
  switch (item.t) {
    case "h": {
      const level = Math.min(Math.max(item.level, 1), 6);
      const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      return <Tag key={key}>{inline(item.inl)}</Tag>;
    }
    case "p":
      return paragraph(item.inl, key, ctx);
    case "ul":
    case "ol": {
      // Amaliyot slaydidagi raqamli ro'yxat — topshiriq kartalari
      const tasks = ctx.kind === "practice" && item.t === "ol" && !ctx.card && !ctx.column;
      return list(item, key, tasks ? "slide-tasks" : undefined);
    }
    case "code":
      return code(item, key);
    case "table": {
      const mono = item.rows.some((row) =>
        row.some((cell) => cell.some((node) => node[0] === "c")),
      );
      return (
        <table key={key} className={cn("slide-table", mono && "slide-table--mono")}>
          <thead>
            <tr>
              {item.head.map((cell, index) => (
                <th key={index} style={{ textAlign: (item.align[index] || undefined) as never }}>
                  {inline(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {item.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, index) => (
                  <td key={index} style={{ textAlign: (item.align[index] || undefined) as never }}>
                    {inline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    case "quote":
      return (
        <aside key={key} className="slide-note">
          {item.blocks.map((inner, index) => block(inner, `${key}-${index}`, ctx))}
        </aside>
      );
    case "cards":
      return cards(item.cards, key, ctx);
    case "cols":
      return (
        <div
          key={key}
          className="slide-cols"
          style={{
            gridTemplateColumns: item.cols
              .map((column) => `minmax(0, ${columnWeight(column)}fr)`)
              .join(" "),
          }}
        >
          {item.cols.map((column, index) => (
            <div key={index} className="slide-col">
              {column.map((inner, k) =>
                block(inner, `${key}-${index}-${k}`, { ...ctx, column: true }),
              )}
            </div>
          ))}
        </div>
      );
    case "index": {
      const count = item.items.length;
      return (
        <div
          key={key}
          className="slide-index"
          style={{ gridTemplateColumns: `auto repeat(${count}, minmax(0, 1fr))` }}
        >
          <span className="slide-index__label">{ctx.labels.from}</span>
          {item.items.map((_, k) => (
            <span key={`from-${k}`} className="slide-index__pos">
              {k}
            </span>
          ))}
          <span className="slide-index__label slide-index__name">{item.name}</span>
          {item.items.map((value, k) => (
            <span key={`item-${k}`} className="slide-index__box">
              {value === " " ? "␣" : value}
            </span>
          ))}
          <span className="slide-index__label">{ctx.labels.end}</span>
          {item.items.map((_, k) => (
            <span key={`end-${k}`} className="slide-index__neg">
              {k - count}
            </span>
          ))}
        </div>
      );
    }
    default:
      return null;
  }
}

/**
 * Bitta slayd 1280×720 maydonda (brend taqdimotlari uslubi: qora fon, kartalar, SIFAT logotipi).
 * Matn sig'masa, shrift bosqichma-bosqich kichrayadi (`--fit`). Kattalashtirish (ekranga moslash) —
 * o'rab turgan komponentning ishi.
 */
export function Slide({ slide, index, label }: { slide: SlideData; index: number; label: string }) {
  const t = useTranslations("Learn");
  const body = useRef<HTMLDivElement>(null);
  const kind = slideKind(slide, index);
  const big = kind === "cover" || kind === "section";
  const kicker = slide.kicker ?? [];
  const title = slide.title ?? [];
  const ctx: Context = {
    kind,
    card: false,
    column: false,
    labels: { from: t("slideIndexFrom"), end: t("slideIndexEnd") },
  };

  useLayoutEffect(() => {
    const element = body.current;
    if (!element) return;
    // Bo'yiga sig'masa yoki kod qatori kartadan chiqib ketsa — hammasi bir pog'ona kichrayadi.
    const overflowing = () =>
      element.scrollHeight > element.clientHeight + 2 ||
      element.scrollWidth > element.clientWidth + 2 ||
      Array.from(element.querySelectorAll<HTMLElement>(".slide-code")).some(
        (code) => code.scrollWidth > code.clientWidth + 1,
      );
    const fit = () => {
      let value = 1;
      element.style.setProperty("--fit", "1");
      while (overflowing() && value > MIN_FIT) {
        value = Math.round((value - 0.05) * 100) / 100;
        element.style.setProperty("--fit", String(value));
      }
    };
    fit();
    // Shriftlar keyinroq yuklanadi: o'lchamlar o'zgaradi — qayta moslaymiz.
    let alive = true;
    void document.fonts?.ready.then(() => {
      if (alive) fit();
    });
    return () => {
      alive = false;
    };
  }, [slide]);

  return (
    <div
      className={cn("slide", `slide--${kind}`, slideFonts)}
      style={{ width: SLIDE_W, height: SLIDE_H }}
      role="group"
      aria-roledescription="slide"
      aria-label={label}
    >
      {kind === "cover" && <Logo className="slide__logo" />}
      <div ref={body} className="slide__body">
        {kicker.length > 0 && <p className="slide__kicker">{inline(kicker)}</p>}
        {title.length > 0 &&
          (big ? (
            <h1 className="slide__title">{inline(title)}</h1>
          ) : (
            <h2 className="slide__title">{inline(title)}</h2>
          ))}
        {slide.blocks.map((item, k) => block(item, String(k), ctx))}
      </div>
      {!big && (
        <footer className="slide__foot" aria-hidden>
          <Logo className="slide__foot-logo" />
          <span>{kind === "summary" ? t("slidesQuestions") : index + 1}</span>
        </footer>
      )}
    </div>
  );
}
