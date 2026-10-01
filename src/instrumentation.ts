import type { Instrumentation } from "next";

/** Server xatolari (SSR, Server Components): JSON log va Sentry (`src/lib/report-error.ts`). */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const { reportServerError } = await import("./lib/report-error");
  await reportServerError(error, request, context);
};
