import { requireFeature } from "@/lib/api/center";

export default async function SectionLayout({
  children,
}: LayoutProps<"/[locale]/dashboard/rating">) {
  await requireFeature("rewards");
  return children;
}
