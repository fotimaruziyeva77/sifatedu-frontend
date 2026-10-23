/**
 * Dars slaydlari → statik HTML: har dars — bitta fayl, har slayd — 1280×720 varaq. Saytdagi
 * `Slide` komponenti va `slides.css` ishlatiladi, shuning uchun PDF saytdagi bilan bir xil.
 *
 * Kirish: `.out/input.json` (backend: `import_course <kurs> --json`). Chiqish: `.out/*.html`,
 * yonida `slides.css` va shriftlar. PDF'ni Chrome yasaydi — hammasini infra/tools/slides_pdf.py
 * boshqaradi. Sahifadagi skript saytdagidek sig'maydigan slaydning shriftini kichraytiradi.
 */
import fs from "node:fs";
import path from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

import { Slide } from "@/features/lesson/slides/slide";
import type { SlideData } from "@/features/lesson/slides/types";

vi.mock("@/fonts/slides", () => ({ slideFonts: "" }));
vi.mock("next-intl", async () => {
  const uz = (await import("../../messages/uz.json")).default;
  const learn: Record<string, string> = uz.Learn;
  return { useTranslations: () => (key: string) => learn[key] ?? key };
});

type Lesson = { path: string; title: string; slides: SlideData[] };

const HERE = import.meta.dirname;
const OUT = path.join(HERE, ".out");
const FONTS = ["rubik", "inter", "jetbrains-mono"];

function page(title: string, slides: SlideData[]): string {
  const faces = FONTS.map((font) =>
    ["latin", "cyrillic"]
      .map(
        (part) =>
          `@font-face { font-family: "${font}-${part}"; font-weight: 100 900; ` +
          `src: url("fonts/${font}-${part}.woff2") format("woff2"); }`,
      )
      .join("\n"),
  ).join("\n");
  const body = slides
    .map(
      (slide, index) =>
        `<div class="page">${renderToStaticMarkup(
          <Slide slide={slide} index={index} label={String(index + 1)} />,
        )}</div>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8">
<title>${title.replace(/</g, "&lt;")}</title>
<link rel="stylesheet" href="slides.css">
<style>
${faces}
:root {
  --font-rubik: "rubik-latin"; --font-rubik-cyrillic: "rubik-cyrillic";
  --font-inter: "inter-latin"; --font-inter-cyrillic: "inter-cyrillic";
  --font-jetbrains: "jetbrains-mono-latin"; --font-jetbrains-cyrillic: "jetbrains-mono-cyrillic";
}
html, body { margin: 0; background: #0d0d0f; }
.page { width: 1280px; height: 720px; overflow: hidden; break-after: page; }
@page { size: 1280px 720px; margin: 0; }
</style>
</head>
<body>
${body}
<script>
const fonts = ["700 20px rubik-latin", "400 20px inter-latin", "400 20px jetbrains-mono-latin"];
Promise.all([document.fonts.ready, ...fonts.map((font) => document.fonts.load(font))]).then(() => {
  for (const body of document.querySelectorAll(".slide__body")) {
    const over = () =>
      body.scrollHeight > body.clientHeight + 2 ||
      body.scrollWidth > body.clientWidth + 2 ||
      [...body.querySelectorAll(".slide-code")].some((code) => code.scrollWidth > code.clientWidth + 1);
    let fit = 1;
    while (over() && fit > 0.55) {
      fit = Math.round((fit - 0.05) * 100) / 100;
      body.style.setProperty("--fit", String(fit));
    }
  }
  document.documentElement.dataset.ready = "1";
});
</script>
</body>
</html>
`;
}

it("slaydlar HTML'ga", () => {
  const input = JSON.parse(fs.readFileSync(path.join(OUT, "input.json"), "utf8")) as {
    lessons: Lesson[];
  };
  fs.mkdirSync(path.join(OUT, "fonts"), { recursive: true });
  fs.copyFileSync(
    path.resolve(HERE, "../../src/features/lesson/slides/slides.css"),
    path.join(OUT, "slides.css"),
  );
  for (const font of FONTS) {
    for (const part of ["latin", "cyrillic"]) {
      const name = `${font}-${part}.woff2`;
      fs.copyFileSync(path.resolve(HERE, "../../src/fonts", name), path.join(OUT, "fonts", name));
    }
  }
  for (const lesson of input.lessons) {
    const name = `${lesson.path.replaceAll("/", "__")}.html`;
    fs.writeFileSync(path.join(OUT, name), page(lesson.title, lesson.slides));
  }
  expect(input.lessons.length).toBeGreaterThan(0);
});
