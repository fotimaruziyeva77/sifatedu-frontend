import { LegalPageView, legalMetadata } from "@/features/legal/legal-page";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: PageProps<"/[locale]/offer">) {
  return legalMetadata("offer", params);
}

export default function Page({ params }: PageProps<"/[locale]/offer">) {
  return <LegalPageView slug="offer" params={params} />;
}
