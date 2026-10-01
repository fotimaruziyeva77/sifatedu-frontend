import { readApiError } from "@/lib/api/errors";

/**
 * Javobni yuklash (multipart). `fetch` yuklash foizini bermaydi, shuning uchun XMLHttpRequest:
 * 50 MB gacha fayl sekin internetda bir necha daqiqa ketishi mumkin — o'quvchi jarayonni ko'radi.
 */

export type UploadResult =
  { ok: true } | { ok: false; message: string | null; fields?: Record<string, string[]> };

function readCookie(name: string): string | undefined {
  const entry = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : undefined;
}

async function csrfToken(): Promise<string | undefined> {
  const existing = readCookie("csrftoken");
  if (existing) return existing;
  await fetch("/api/v1/auth/csrf/", { credentials: "same-origin" });
  return readCookie("csrftoken");
}

function parseError(body: string): { message: string | null; fields?: Record<string, string[]> } {
  try {
    const error = readApiError(JSON.parse(body));
    return { message: error?.message || null, fields: error?.fields };
  } catch {
    return { message: null };
  }
}

/** `url` — uy vazifasi (`/api/v1/homework/{id}/submissions/`) yoki imtihon topshirig'i javobi. */
export async function uploadAnswer(
  url: string,
  form: FormData,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  const token = await csrfToken();
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open("POST", url);
    request.withCredentials = true;
    if (token) request.setRequestHeader("X-CSRFToken", token);
    request.setRequestHeader("Accept-Language", document.documentElement.lang || "uz");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve({ ok: true });
        return;
      }
      if (request.status === 413) {
        resolve({ ok: false, message: null, fields: { files: ["too_large"] } });
        return;
      }
      resolve({ ok: false, ...parseError(request.responseText) });
    };
    request.onerror = () => resolve({ ok: false, message: null });
    request.send(form);
  });
}
