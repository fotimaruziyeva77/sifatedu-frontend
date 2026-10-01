import { notFound } from "next/navigation";

// Mavjud bo'lmagan barcha yo'llar lokalizatsiya qilingan 404 sahifasiga tushadi.
export default function CatchAllPage() {
  notFound();
}
