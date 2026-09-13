"use client";

import { Menu } from "lucide-react";
import { signOut } from "next-auth/react";

import { ds } from "@/lib/design-system";
import { initials } from "@/lib/dashboard/format";
import { BrandMark } from "@/components/brand/mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";

export type MenuBarUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export function MenuBar({
  user,
  mobileOpen,
  onMobileOpenChange,
}: {
  user: MenuBarUser;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  const roleLabel =
    user.role === "CREATOR" ? "Creator Portal" : "Studio Portal";

  return (
    <header
      className="w-full shrink-0 bg-[#fafafa] pb-1"
      data-purpose="main-header"
    >
      <nav
        aria-label="Global Navigation"
        className={`${ds.nav} mx-auto flex w-full max-w-[1600px] items-center justify-between px-3 py-2 sm:px-4`}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-white hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Open navigation"
            onClick={() => onMobileOpenChange(true)}
          >
            <Menu className="size-4" />
          </Button>
          <BrandMark href="/dashboard" variant="dark" size="sm" />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Badge
            variant="outline"
            className="hidden border-white/15 bg-white/10 text-neutral-200 sm:inline-flex"
          >
            {roleLabel}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Account menu"
            >
              <Avatar>
                <AvatarFallback>
                  {initials(user.name ?? null, user.email ?? "U")}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuLabel>
                <p className="truncate text-sm font-semibold text-neutral-950">
                  {user.name || "Account"}
                </p>
                <p className="truncate font-mono text-[11px] font-normal text-neutral-500">
                  {user.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="bg-white p-5">
          <SheetHeader className="p-0">
            <SheetTitle className="text-left">
              <BrandMark size="sm" />
            </SheetTitle>
            <SheetDescription>{roleLabel}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 flex min-h-0 flex-1 flex-col">
            <SidebarNav user={user} onNavigate={() => onMobileOpenChange(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
