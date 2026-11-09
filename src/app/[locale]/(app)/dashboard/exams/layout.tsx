import { requireFeature } from "@/lib/api/center";

export default async function SectionLayout({
  children,
}: LayoutProps<"/[locale]/dashboard/exams">) {
  await requireFeature("exams");
  return children;
}
