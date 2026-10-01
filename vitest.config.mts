import path from "node:path";

import { defineConfig } from "vitest/config";

// Sof funksiyalar uchun unit testlar. Brauzerdagi oqimlar — e2e/ (Playwright).
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
