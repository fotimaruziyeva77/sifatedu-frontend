import { describe, expect, it } from "vitest";

import { buildCsp, createNonce, originOf, sentryOrigin } from "./csp";

const directive = (csp: string, name: string) =>
  csp.split("; ").find((part) => part.startsWith(`${name} `)) ?? "";

describe("buildCsp", () => {
  const base = { nonce: "abc123", storage: ["https://s3.example.uz"] };

  it("skriptlarga faqat nonce va strict-dynamic bilan ruxsat beradi", () => {
    const csp = buildCsp({ ...base, dev: false });
    const scripts = directive(csp, "script-src");

    expect(scripts).toContain("'nonce-abc123'");
    expect(scripts).toContain("'strict-dynamic'");
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(scripts).not.toContain("'unsafe-eval'");
  });

  it("production'da https'ga majburlaydi va freym ichida ochilishni taqiqlaydi", () => {
    const csp = buildCsp({ ...base, dev: false });

    expect(csp).toContain("upgrade-insecure-requests");
    expect(directive(csp, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(csp, "object-src")).toBe("object-src 'none'");
  });

  it("dev'da eval va HMR WebSocket'ga ruxsat beradi", () => {
    const csp = buildCsp({ ...base, dev: true });

    expect(directive(csp, "script-src")).toContain("'unsafe-eval'");
    expect(directive(csp, "connect-src")).toContain("ws:");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("storage manzili rasm, video va so'rovlar uchun ochiq", () => {
    const csp = buildCsp({ ...base, dev: false });

    for (const name of ["img-src", "media-src", "connect-src"]) {
      expect(directive(csp, name)).toContain("https://s3.example.uz");
    }
    // hls.js: MediaSource va Web Worker blob manzilda.
    expect(directive(csp, "media-src")).toContain("blob:");
    expect(directive(csp, "worker-src")).toContain("blob:");
  });

  it("Sentry manzili faqat berilganda qo'shiladi", () => {
    const without = buildCsp({ ...base, dev: false });
    const withSentry = buildCsp({
      ...base,
      dev: false,
      reportOrigin: "https://o1.ingest.sentry.io",
    });

    expect(directive(without, "connect-src")).not.toContain("sentry");
    expect(directive(withSentry, "connect-src")).toContain("https://o1.ingest.sentry.io");
  });

  it("takroriy manzillarni bir marta yozadi", () => {
    const csp = buildCsp({ nonce: "n", dev: false, storage: ["https://a.uz", "https://a.uz"] });

    expect(directive(csp, "img-src").match(/https:\/\/a\.uz/g)).toHaveLength(1);
  });
});

describe("originOf", () => {
  it("yo'l va query'ni tashlab, faqat origin qoldiradi", () => {
    expect(originOf("http://localhost:9000/sifat-public/x.jpg?a=1")).toBe("http://localhost:9000");
  });

  it("noto'g'ri yoki bo'sh qiymatda null", () => {
    expect(originOf("")).toBeNull();
    expect(originOf(undefined)).toBeNull();
    expect(originOf("not a url")).toBeNull();
  });

  it("Sentry DSN'dagi kalitni origin'ga qo'shmaydi", () => {
    expect(sentryOrigin("https://secretkey@o42.ingest.sentry.io/7")).toBe(
      "https://o42.ingest.sentry.io",
    );
  });
});

describe("createNonce", () => {
  it("har safar yangi va yetarlicha uzun", () => {
    const values = new Set(Array.from({ length: 50 }, createNonce));

    expect(values.size).toBe(50);
    for (const value of values) expect(value.length).toBeGreaterThanOrEqual(22);
  });
});
