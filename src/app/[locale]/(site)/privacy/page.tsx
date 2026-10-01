import { LegalPageView, legalMetadata } from "@/features/legal/legal-page";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: PageProps<"/[locale]/privacy">) {
  return legalMetadata("privacy", params);
}

export default function Page({ params }: PageProps<"/[locale]/privacy">) {
  return <LegalPageView slug="privacy" params={params} />;
}
