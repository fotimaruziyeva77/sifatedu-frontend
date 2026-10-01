/**
 * AI javobidagi oddiy belgilash: paragraflar, "- " ro'yxat, **qalin** va https havolalar.
 * HTML hech qachon talqin qilinmaydi — matn bo'laklarga ajratiladi, React ularni o'zi qochiradi.
 */

export type Inline = { type: "text" | "bold"; value: string } | { type: "link"; href: string };
export type Block = { type: "paragraph"; lines: Inline[][] } | { type: "list"; items: Inline[][] };

const INLINE_RE = /(\*\*[^*\n]+\*\*|https:\/\/[^\s<>()]+[^\s<>().,!?;:'"»])/g;
const LIST_RE = /^\s*(?:[-•*]|\d+[.)])\s+/;

export function parseInline(text: string): Inline[] {
  const parts: Inline[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE_RE)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ type: "text", value: text.slice(last, index) });
    const token = match[0];
    parts.push(
      token.startsWith("**")
        ? { type: "bold", value: token.slice(2, -2) }
        : { type: "link", href: token },
    );
    last = index + token.length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

export function parseRichText(text: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of text.trim().split(/\n{2,}/)) {
    const lines = chunk.split("\n").filter((line) => line.trim());
    let paragraph: Inline[][] = [];
    let list: Inline[][] = [];
    const flushParagraph = () => {
      if (paragraph.length) blocks.push({ type: "paragraph", lines: paragraph });
      paragraph = [];
    };
    const flushList = () => {
      if (list.length) blocks.push({ type: "list", items: list });
      list = [];
    };
    for (const line of lines) {
      if (LIST_RE.test(line)) {
        flushParagraph();
        list.push(parseInline(line.replace(LIST_RE, "")));
      } else {
        flushList();
        paragraph.push(parseInline(line));
      }
    }
    flushParagraph();
    flushList();
  }
  return blocks;
}
