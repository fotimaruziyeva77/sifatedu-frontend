import { TRACKS, type Track } from "@/components/three/constellation";

/** Kurs yo'nalishi kategoriya slug'idan olinadi; tanish bo'lmasa — umumiy rang. */
export type TrackKey = Track | "default";

export function trackOf(categorySlug: string | undefined): TrackKey {
  return (TRACKS as readonly string[]).includes(categorySlug ?? "")
    ? (categorySlug as Track)
    : "default";
}

export function trackColor(track: TrackKey): string {
  return `var(--track-${track})`;
}
