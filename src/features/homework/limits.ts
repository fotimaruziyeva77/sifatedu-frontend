/** Backend bilan bir xil (apps/homework/files.py): brauzerda oldindan tekshiriladi. */
export const MAX_FILES = 5;
export const MAX_FILE_MB = 20;
export const MAX_TOTAL_MB = 50;

export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
export const ALLOWED_EXTENSIONS = [
  ...IMAGE_EXTENSIONS,
  ...[".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".md", ".csv"],
  ...[".zip", ".rar", ".7z"],
  ...[".html", ".css", ".scss", ".js", ".jsx", ".ts", ".tsx", ".json", ".py", ".ipynb"],
  ...[".java", ".kt", ".c", ".cpp", ".h", ".cs", ".php", ".go", ".sql", ".swift"],
  ...[".svg", ".fig", ".psd", ".sb3", ".mp4", ".webm"],
];

export const CODE_LANGUAGES = [
  "html",
  "css",
  "javascript",
  "typescript",
  "python",
  "sql",
  "java",
  "cpp",
  "other",
] as const;

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export type FileProblem = "type" | "size" | "count" | "total" | null;

/** Birinchi muammo (bo'lsa): fayl turi, hajmi, soni yoki jami hajm. */
export function checkFiles(files: readonly File[]): { problem: FileProblem; name?: string } {
  if (files.length > MAX_FILES) return { problem: "count" };
  for (const file of files) {
    if (!ALLOWED_EXTENSIONS.includes(extensionOf(file.name))) {
      return { problem: "type", name: file.name };
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) return { problem: "size", name: file.name };
  }
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_TOTAL_MB * 1024 * 1024) return { problem: "total" };
  return { problem: null };
}
