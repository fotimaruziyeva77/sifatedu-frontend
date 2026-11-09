import { requireFeature } from "@/lib/api/center";

export default async function SectionLayout({
  children,
}: LayoutProps<"/[locale]/dashboard/rewards">) {
  await requireFeature("rewards");
  return children;
}
