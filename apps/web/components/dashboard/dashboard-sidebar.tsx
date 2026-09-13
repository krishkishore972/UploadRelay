"use client";

import { BrandMark } from "@/components/brand/mark";
import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "./sidebar-nav";
import type { MenuBarUser } from "./menu-bar";

export function DashboardSidebar({ user }: { user: MenuBarUser }) {
  return (
    <aside
      className="sticky top-24 hidden min-h-[calc(100dvh-8rem)] flex-col rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] lg:flex lg:col-span-3"
      data-purpose="sidebar-navigation"
    >
      <div className="mb-4 pb-1">
        <BrandMark href="/dashboard" size="sm" />
      </div>
      <Separator className="mb-4" />
      <SidebarNav user={user} />
    </aside>
  );
}
