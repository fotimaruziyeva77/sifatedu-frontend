/** Backend xato formati: `{"error": {"code", "message", "fields"?, "retry_after"?}}`. */
export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
  retry_after?: number;
};

export function readApiError(body: unknown): ApiError | null {
  if (typeof body !== "object" || body === null || !("error" in body)) return null;
  const error = (body as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return null;
  const value = error as Partial<ApiError>;
  return {
    code: typeof value.code === "string" ? value.code : "error",
    message: typeof value.message === "string" ? value.message : "",
    fields: value.fields && typeof value.fields === "object" ? value.fields : undefined,
    retry_after: typeof value.retry_after === "number" ? value.retry_after : undefined,
  };
}

/** Maydon xatosining birinchi matni (`non_field_errors` — butun forma uchun). */
export function fieldMessage(error: ApiError | null, field: string): string | undefined {
  return error?.fields?.[field]?.[0];
}
