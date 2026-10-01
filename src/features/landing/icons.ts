import { createElement } from "react";
import {
  Accessibility,
  Award,
  Blocks,
  Brain,
  CodeXml,
  Database,
  Headphones,
  Infinity as InfinityIcon,
  Languages,
  type LucideIcon,
  Monitor,
  MonitorPlay,
  Palette,
  Rocket,
  Server,
  Shield,
  Smartphone,
  Terminal,
  Users,
  Wifi,
} from "lucide-react";

/** Backend'dagi `icon` qiymatlari (Advantage.Icon, Course.Icon) → lucide ikonkalari. */
export const ICONS: Record<string, LucideIcon> = {
  video: MonitorPlay,
  code: CodeXml,
  users: Users,
  languages: Languages,
  wifi: Wifi,
  infinity: InfinityIcon,
  award: Award,
  headphones: Headphones,
  accessibility: Accessibility,
  rocket: Rocket,
  server: Server,
  database: Database,
  palette: Palette,
  smartphone: Smartphone,
  brain: Brain,
  blocks: Blocks,
  monitor: Monitor,
  terminal: Terminal,
  shield: Shield,
};

export function iconFor(name: string): LucideIcon {
  return ICONS[name] ?? CodeXml;
}

/**
 * Nomi bo'yicha ikonka. `createElement` ishlatiladi: ikonkalar modul darajasidagi tayyor
 * komponentlar, render paytida yangi komponent yaratilmaydi.
 */
export function NamedIcon({ name, className }: { name: string; className?: string }) {
  return createElement(iconFor(name), { "aria-hidden": true, className });
}
