"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ChevronRight,
  Clapperboard,
  LayoutGrid,
  LogOut,
  UploadCloud,
  User as UserIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useUploadDialog } from "@/components/upload/upload-dialog-context";
import type { MenuBarUser } from "./menu-bar";

export function DashboardSidebar({ user }: { user: MenuBarUser }) {
  const pathname = usePathname();
  const { openUpload } = useUploadDialog();
  const onDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isCreator = user.role === "CREATOR";

  const linkClass = (active: boolean) =>
    cn(
      "smooth-transition flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs",
      active
        ? "bg-neutral-950 font-semibold text-white shadow-sm"
        : "font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950",
    );
  const iconClass = (active: boolean) =>
    active ? "h-4 w-4 text-white" : "h-4 w-4 text-neutral-400";

  return (
    <aside
      className="flex min-h-[480px] flex-col justify-between rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] lg:col-span-3 lg:min-h-[780px]"
      data-purpose="sidebar-navigation"
    >
      <div>
        <div className="mb-4 flex items-center justify-between border-b border-neutral-100 px-2 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-950 text-xs font-bold tracking-wider text-white">
              UR
            </div>
            <div>
              <h2 className="text-xs font-bold leading-tight tracking-tight text-neutral-950">
                UploadRelay
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                Creator &amp; Studio
              </span>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live
          </span>
        </div>

        <nav aria-label="Sidebar Primary Navigation" className="space-y-1">
          <Link href="/dashboard" className={linkClass(onDashboard)}>
            <LayoutGrid className={iconClass(onDashboard)} aria-hidden="true" />
            <span>Overview</span>
          </Link>
          <Link href="/dashboard#library" className={linkClass(false)}>
            <Clapperboard className={iconClass(false)} aria-hidden="true" />
            <span>{isCreator ? "Review Queue" : "Master Deliveries"}</span>
          </Link>
          {isCreator ? null : (
            <button
              type="button"
              onClick={openUpload}
              className={cn(linkClass(false), "w-full text-left")}
            >
              <UploadCloud className={iconClass(false)} aria-hidden="true" />
              <span>New Upload</span>
            </button>
          )}
          {/* Placeholder: YouTube connect, comments/activity, versions land here post-MVP. */}
          <span
            className={cn(linkClass(false), "cursor-not-allowed opacity-60")}
            title="Coming soon: YouTube connect, comments, version history"
          >
            <span className="h-4 w-4 text-center text-neutral-400">○</span>
            <span>Publishing & Activity</span>
            <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-neutral-500">
              Soon
            </span>
          </span>
        </nav>
      </div>

      <div className="border-t border-neutral-100 pt-5">
        <div className="smooth-transition mb-2 flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200/60 bg-neutral-50 p-3 hover:bg-neutral-100/80">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-800">
              <UserIcon className="h-4 w-4 text-neutral-600" aria-hidden="true" />
            </div>
            <div className="truncate">
              <p className="truncate text-xs font-semibold leading-snug text-neutral-950">
                {user.name || "Editor"}
              </p>
              <p className="truncate font-mono text-[11px] text-neutral-500">
                {user.email ?? "studio member"}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="smooth-transition flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
          data-purpose="signout-button"
        >
          <LogOut
            className="h-4 w-4 rotate-180 text-neutral-400"
            aria-hidden="true"
          />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
