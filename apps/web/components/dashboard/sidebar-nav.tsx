"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Clapperboard,
  Film,
  LayoutGrid,
  Link2,
  LogOut,
  Youtube,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/dashboard/format";
import type { MenuBarUser } from "./menu-bar";

type SidebarNavProps = {
  user: MenuBarUser;
  onNavigate?: () => void;
};

export function SidebarNav({ user, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const isCreator = user.role === "CREATOR";

  const items = isCreator
  ? [
      { href: "/dashboard", label: "Overview", icon: LayoutGrid, exact: true },
      { href: "/dashboard/review", label: "Review queue", icon: Clapperboard },
      { href: "/dashboard/videos", label: "Videos", icon: Film },
      { href: "/dashboard/youtube", label: "YouTube", icon: Youtube },
      { href: "/dashboard/links", label: "Invite editor", icon: Link2 },
    ]
  : [
      { href: "/dashboard", label: "Overview", icon: LayoutGrid, exact: true },
      { href: "/dashboard/videos", label: "Videos", icon: Film },
      { href: "/dashboard/links", label: "Link creator", icon: Link2 },
    ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const itemClass = (active: boolean) =>
    cn(
      "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs transition-colors",
      active
        ? "bg-neutral-950 font-semibold text-white shadow-sm"
        : "font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950",
    );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav aria-label="Dashboard" className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => onNavigate?.()}
            className={itemClass(isActive(item.href, item.exact))}
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-5">
        <Separator className="mb-4" />
        <div className="mb-2 flex items-center gap-3 rounded-2xl border border-neutral-200/70 bg-neutral-50 p-3">
          <Avatar>
            <AvatarFallback>
              {initials(user.name ?? null, user.email ?? "U")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-neutral-950">
              {user.name || (isCreator ? "Creator" : "Editor")}
            </p>
            <p className="truncate font-mono text-[11px] text-neutral-500">
              {user.email ?? "studio member"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2.5 rounded-xl px-3 text-xs text-neutral-500"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4 rotate-180" aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
