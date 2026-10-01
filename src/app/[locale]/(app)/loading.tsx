import { PageLoader } from "@/components/site/page-loader";

/** Bo'limlar orasida o'tishda: ramka (menyu, header) joyida qoladi, kontent o'rnida loader. */
export default function Loading() {
  return <PageLoader className="min-h-[50svh]" />;
}
