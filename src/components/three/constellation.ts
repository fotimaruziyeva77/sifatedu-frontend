/**
 * "Ko'nikmalar turkumi" ma'lumotlari: tugunlar, ular orasidagi bog'lanishlar va joylashuv.
 * three.js'ga bog'liq emas — hisob-kitob deterministik (bir xil seed → bir xil turkum).
 */

export const TRACKS = ["frontend", "backend", "design", "basics"] as const;
export type Track = (typeof TRACKS)[number];

export const SKILLS = [
  { id: "html", track: "frontend" },
  { id: "css", track: "frontend" },
  { id: "javascript", track: "frontend" },
  { id: "react", track: "frontend" },
  { id: "python", track: "backend" },
  { id: "django", track: "backend" },
  { id: "sql", track: "backend" },
  { id: "figma", track: "design" },
  { id: "uiux", track: "design" },
  { id: "git", track: "basics" },
  { id: "algorithms", track: "basics" },
  { id: "typescript", track: "frontend" },
  { id: "api", track: "backend" },
  { id: "linux", track: "basics" },
] as const satisfies readonly { id: string; track: Track }[];

export type SkillId = (typeof SKILLS)[number]["id"];

/** Kuchsiz qurilmada faqat birinchi N ta ko'nikma ko'rsatiladi (ro'yxat shunga tartiblangan). */
export const SKILLS_LOW_TIER = 10;

/** Ko'nikmalar grafigi: bir yo'nalish ichida va yo'nalishlar orasidagi "ko'priklar". */
export const SKILL_LINKS: readonly [SkillId, SkillId][] = [
  ["html", "css"],
  ["css", "javascript"],
  ["javascript", "react"],
  ["react", "typescript"],
  ["javascript", "typescript"],
  ["python", "django"],
  ["django", "sql"],
  ["django", "api"],
  ["python", "sql"],
  ["figma", "uiux"],
  ["uiux", "css"],
  ["git", "linux"],
  ["algorithms", "python"],
  ["algorithms", "javascript"],
  ["git", "javascript"],
  ["api", "react"],
];

/**
 * Ko'nikmalar turkum sirtida qo'lda joylashtirilgan: yo'nalishlar o'z tomonida to'planadi,
 * lekin yorliqlar bir-birining ustiga tushmasligi uchun orasida yetarli masofa bor.
 */
const SKILL_DIRECTIONS: Record<SkillId, [number, number, number]> = {
  html: [-0.92, 0.3, 0.18],
  css: [-0.52, 0.82, 0.22],
  javascript: [-0.36, 0.18, 0.92],
  react: [-0.78, -0.22, 0.58],
  typescript: [-0.05, 0.78, 0.62],
  python: [0.34, -0.12, 0.93],
  django: [0.8, -0.38, 0.46],
  sql: [0.42, -0.88, 0.2],
  api: [0.9, 0.28, 0.34],
  figma: [0.4, 0.84, -0.36],
  uiux: [0.86, 0.36, -0.36],
  git: [-0.46, -0.72, -0.52],
  algorithms: [-0.02, -0.72, 0.7],
  linux: [-0.86, -0.36, -0.36],
};

/** Turkum shakli: biroz yassilangan ellipsoid. */
const ELLIPSOID: [number, number, number] = [1.22, 0.92, 0.85];

export type NodeKind = "star" | "skill" | "spark";

export type ConstellationNode = {
  kind: NodeKind;
  /** Ko'nikma tuguni uchun. */
  skill?: SkillId;
  track?: Track;
  /** Turkumdagi joyi (radius 1 bo'yicha). */
  cloud: [number, number, number];
  /** Suzish fazasi. */
  phase: number;
};

/** Mulberry32: tez va deterministik tasodifiy sonlar. */
export function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalize([x, y, z]: [number, number, number]): [number, number, number] {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

function randomDirection(rand: () => number): [number, number, number] {
  const u = rand() * 2 - 1;
  const angle = rand() * Math.PI * 2;
  const r = Math.sqrt(1 - u * u);
  return [r * Math.cos(angle), r * Math.sin(angle), u];
}

function stretch([x, y, z]: [number, number, number], radius: number): [number, number, number] {
  return [x * radius * ELLIPSOID[0], y * radius * ELLIPSOID[1], z * radius * ELLIPSOID[2]];
}

/**
 * Turkum tugunlari: avval ko'nikmalar, keyin "uchqun"lar (logodagi qizil chiziqdan keladi),
 * qolgani — yulduzlar.
 */
export function createConstellation(options: {
  count: number;
  skills: number;
  sparks: number;
  seed?: number;
}): ConstellationNode[] {
  const rand = random(options.seed ?? 7);
  const nodes: ConstellationNode[] = [];

  for (const skill of SKILLS.slice(0, options.skills)) {
    nodes.push({
      kind: "skill",
      skill: skill.id,
      track: skill.track,
      cloud: stretch(normalize(SKILL_DIRECTIONS[skill.id]), 0.84 + rand() * 0.1),
      phase: rand() * Math.PI * 2,
    });
  }

  const rest = options.count - nodes.length;
  for (let index = 0; index < rest; index += 1) {
    // Yarmi qobiqda (aniq shakl), yarmi ichkarida (chuqurlik).
    const onShell = rand() < 0.48;
    const radius = onShell ? 0.78 + rand() * 0.28 : 0.2 + Math.sqrt(rand()) * 0.62;
    nodes.push({
      kind: index < options.sparks ? "spark" : "star",
      cloud: stretch(randomDirection(rand), radius),
      phase: rand() * Math.PI * 2,
    });
  }

  return nodes;
}

export type HeroFocus = {
  /** Turkum markazi (canvas pikselida). */
  x: number;
  y: number;
  /** Logo eni va turkum radiusi (pikselda). */
  logoWidth: number;
  radius: number;
};

/**
 * Hero'da turkum qayerda turadi. Katta ekranda o'ng tomonda (matn chapda), kichik ekranda
 * canvas faqat yuqori qismni egallaydi va turkum uning markazida. Poster ham shu nisbatlarda
 * joylashadi (hero-poster.tsx).
 */
export function heroFocus(width: number, height: number): HeroFocus {
  if (width >= 1024) {
    return {
      x: width * 0.7,
      y: height * 0.47,
      logoWidth: Math.min(width * 0.4, 620),
      radius: Math.min(width * 0.21, height * 0.36, 340),
    };
  }
  return {
    x: width * 0.5,
    y: height * 0.5,
    logoWidth: Math.min(width * 0.78, 560),
    radius: Math.min(width * 0.36, height * 0.4),
  };
}
