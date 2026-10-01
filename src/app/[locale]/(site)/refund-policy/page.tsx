import { LegalPageView, legalMetadata } from "@/features/legal/legal-page";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: PageProps<"/[locale]/refund-policy">) {
  return legalMetadata("refund-policy", params);
}

export default function Page({ params }: PageProps<"/[locale]/refund-policy">) {
  return <LegalPageView slug="refund-policy" params={params} />;
}
