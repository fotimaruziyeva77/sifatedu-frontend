"use client";

import { LayoutDashboard, LogOut, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import type { ViewerSummary } from "@/lib/api/me";

import { UserAvatar } from "./user-avatar";

/** Chiqish: session yopiladi, server komponentlari (header) qayta chiziladi. */
export function useLogout() {
  const t = useTranslations("Nav");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      try {
        await api.POST("/api/v1/auth/logout/");
      } catch {
        toast.error(t("logoutFailed"));
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return { logout, pending };
}

export function UserMenu({ viewer }: { viewer: ViewerSummary }) {
  const t = useTranslations("Nav");
  const { logout, pending } = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("account")}
        className="rounded-full transition-transform hover:scale-105"
      >
        <UserAvatar name={viewer.fullName} src={viewer.avatar} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-semibold">{viewer.fullName}</span>
          <span className="font-mono text-xs font-normal text-muted-foreground">
            {viewer.phone}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard aria-hidden />
            {t("dashboard")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings aria-hidden />
            {t("settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={pending} onSelect={logout}>
          <LogOut aria-hidden />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
