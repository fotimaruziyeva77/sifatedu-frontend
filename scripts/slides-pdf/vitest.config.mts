import path from "node:path";

import { defineConfig } from "vitest/config";

// Dars slaydlari → statik HTML (PDF uchun). Oddiy testlar qatoriga kirmaydi:
// faqat infra/tools/slides_pdf.py ishga tushiradi (`npx vitest run --config ...`).
export default defineConfig({
  root: path.resolve(import.meta.dirname, "../.."),
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "../../src") } },
  oxc: { jsx: { runtime: "automatic" } },
  test: { environment: "node", include: ["scripts/slides-pdf/render.tsx"] },
});
