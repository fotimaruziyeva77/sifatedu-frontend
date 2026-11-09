import { requireFeature } from "@/lib/api/center";

export default async function SectionLayout({
  children,
}: LayoutProps<"/[locale]/dashboard/daily-test">) {
  await requireFeature("exams");
  return children;
}
