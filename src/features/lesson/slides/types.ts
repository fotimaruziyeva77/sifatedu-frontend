/** Slayd bloklari — backend `apps/catalog/slides.py` dagi tuzilma. */

export type Inline =
  ["t", string] | ["c", string] | ["br"] | ["b" | "i" | "s", Inline[]] | ["a", string, Inline[]];

export type ListItem = { inl: Inline[]; sub: ListBlock | null };
export type ListBlock = { t: "ul" | "ol"; items: ListItem[]; start?: number };

export type Tone = "qizil" | "sariq" | "yashil" | "kok";

/** Karta: `###` (sarlavha) yoki `####` (kichik yorliq) va undan keyingi bloklar. */
export type Card = {
  title: Inline[];
  label: boolean;
  tone: Tone | "";
  num: string;
  blocks: Block[];
};

export type CodeBlock = { t: "code"; lang: string; lines: [string, string][][] };

export type Block =
  | { t: "h"; level: number; inl: Inline[] }
  | { t: "p"; inl: Inline[] }
  | ListBlock
  | CodeBlock
  | { t: "table"; head: Inline[][]; rows: Inline[][][]; align: string[] }
  | { t: "quote"; blocks: Block[] }
  | { t: "cards"; cards: Card[] }
  | { t: "cols"; cols: Block[][] }
  | { t: "index"; name: string; items: string[]; chars: boolean };

export type SlideKind = "cover" | "section" | "plain" | "practice" | "summary" | "quiz";

export type SlideData = {
  kind?: SlideKind;
  kicker?: Inline[];
  title?: Inline[];
  blocks: Block[];
};

export type SlidesPayload = { count: number; slides: unknown; teacher_notes: string };

/** Ekranda chiqadigan natija (kod emas): ```text``` va tili ko'rsatilmagan bloklar. */
const OUTPUT = new Set(["", "text", "natija", "output"]);

/** API `slides` maydoni JSON — shaklini tekshirmasdan ishonamiz (backend o'zi tuzadi). */
export function slideList(payload: SlidesPayload | null | undefined): SlideData[] {
  return Array.isArray(payload?.slides) ? (payload.slides as SlideData[]) : [];
}

export function isOutput(block: CodeBlock): boolean {
  return OUTPUT.has(block.lang.toLowerCase());
}

/** Slayd turi; eski tuzilmada (turi yo'q) — birinchi `#` sarlavhali slayd muqova. */
export function slideKind(slide: SlideData, index: number): SlideKind {
  if (slide.kind) return slide.kind;
  const top = slide.blocks[0];
  if (top?.t === "h" && top.level === 1) return index === 0 ? "cover" : "section";
  return "plain";
}

/** Kartalar to'ri ustunlari: 4 ta qisqa matnli karta — bir qatorda, aks holda 2×2. */
export function cardColumns(cards: Card[]): number {
  const count = cards.length;
  if (count <= 3) return Math.max(count, 1);
  if (count === 4) {
    const short = cards.every(
      (card) => card.blocks.every((item) => item.t === "p") && plainText(card.blocks).length <= 90,
    );
    return short ? 4 : 2;
  }
  return count <= 6 || count === 9 ? 3 : 4;
}

/** Ustun kengligi: kod bilan boshlangan ustun kengroq (kod uzun qatorli bo'ladi). */
export function columnWeight(column: Block[]): number {
  const first = column[0];
  const lead = first?.t === "cards" ? first.cards[0]?.blocks[0] : first;
  return lead?.t === "code" && !isOutput(lead) ? 1.4 : 1;
}

function plainText(blocks: Block[]): string {
  return blocks
    .map((item) => (item.t === "p" ? inlineText(item.inl) : ""))
    .join(" ")
    .trim();
}

export function inlineText(nodes: Inline[]): string {
  return nodes
    .map((node) => {
      switch (node[0]) {
        case "t":
        case "c":
          return node[1];
        case "b":
        case "i":
        case "s":
          return inlineText(node[1]);
        case "a":
          return inlineText(node[2]);
        default:
          return " ";
      }
    })
    .join("");
}
