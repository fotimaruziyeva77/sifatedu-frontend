import "server-only";

import { maskPhones, withoutQuery } from "./scrub";

/**
 * Server (SSR) xatolari: har doim bir qatorli JSON log, `SENTRY_DSN` bo'lsa Sentry'ga ham.
 *
 * Sentry SDK'si ishlatilmaydi: u server bundle'iga og'ir bog'liqliklar qo'shadi. Xato Sentry'ning
 * ochiq "envelope" API'si orqali oddiy `fetch` bilan yuboriladi.
 */

type RequestInfo = { path: string; method: string };
type ContextInfo = { routerKind: string; routePath: string; routeType: string };

export async function reportServerError(
  error: unknown,
  request: RequestInfo,
  context: ContextInfo,
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest: unknown }).digest)
      : undefined;

  const record = {
    ts: new Date().toISOString(),
    level: "ERROR",
    logger: "next",
    message: maskPhones(err.message),
    type: err.name,
    digest,
    method: request.method,
    path: withoutQuery(request.path),
    route: context.routePath,
    routeType: context.routeType,
  };
  console.error(JSON.stringify(record));

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    await sendToSentry(dsn, err, record);
  } catch {
    // Monitoring ishlamasa ham sahifa xatosi odatdagidek qaytadi.
  }
}

async function sendToSentry(
  dsn: string,
  err: Error,
  record: Record<string, string | undefined>,
): Promise<void> {
  const url = new URL(dsn);
  const project = url.pathname.replace(/^\//, "");
  const key = url.username;
  if (!project || !key) return;

  const eventId = crypto.randomUUID().replaceAll("-", "");
  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "node",
    level: "error",
    logger: "next",
    environment: process.env.SENTRY_ENVIRONMENT ?? "production",
    transaction: record.route,
    tags: { method: record.method ?? "", route_type: record.routeType ?? "" },
    extra: { digest: record.digest, path: record.path },
    exception: {
      values: [
        {
          type: err.name,
          value: record.message,
          stacktrace: { frames: framesOf(err) },
        },
      ],
    },
  };
  const envelope = [
    JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");

  await fetch(`${url.protocol}//${url.host}/api/${project}/envelope/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-sentry-envelope",
      "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${key}, sentry_client=sifatedu-next/1.0`,
    },
    body: envelope,
    signal: AbortSignal.timeout(3000),
  });
}

/** Sentry kutadigan tartibda: eng ichki chaqiruv oxirida. */
function framesOf(err: Error): { function: string; filename: string; lineno?: number }[] {
  const lines = (err.stack ?? "").split("\n").slice(1, 30);
  return lines
    .map((line) => {
      const match = line.match(/at (?:(.+?) \()?(.+?):(\d+):\d+\)?$/);
      if (!match) return null;
      return { function: match[1] ?? "?", filename: match[2], lineno: Number(match[3]) };
    })
    .filter((frame): frame is { function: string; filename: string; lineno: number } =>
      Boolean(frame),
    )
    .reverse();
}
