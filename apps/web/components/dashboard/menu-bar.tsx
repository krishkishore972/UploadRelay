"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";
import { initials } from "@/lib/dashboard/format";
import { useUploadDialog } from "@/components/upload/upload-dialog-context";

export type MenuBarUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export function MenuBar({ user }: { user: MenuBarUser }) {
  const pathname = usePathname();
  const { openUpload } = useUploadDialog();
  const isDashboardActive =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  return (
    <header className="sticky top-0 z-40 border-b border-background-200 bg-background-50/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/dashboard"
          className="group flex shrink-0 items-center gap-2.5"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-700 text-sm font-extrabold text-text-50 shadow-sm transition-transform group-hover:scale-105">
            R
          </span>
          <span className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-text-950">
            UploadRelay
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-700" />
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Primary">
          <Link
            href="/dashboard"
            aria-current={isDashboardActive ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isDashboardActive
                ? "bg-background-200 text-text-950"
                : "text-text-700 hover:bg-background-100 hover:text-text-950",
            )}
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={openUpload}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "text-text-700 hover:bg-background-100 hover:text-text-950",
            )}
          >
            Upload
          </button>
        </nav>

        <button
          type="button"
          onClick={openUpload}
          className="hidden items-center gap-1.5 rounded-lg bg-primary-700 px-3 py-2 text-sm font-semibold text-text-50 transition-colors hover:bg-primary-800 sm:inline-flex"
        >
          <UploadCloud className="size-4" aria-hidden="true" />
          Upload
        </button>

        <div className="flex items-center gap-3 pl-1">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold leading-tight text-text-950">
              {user.name || "Editor"}
            </p>
            <p className="text-[11px] capitalize leading-tight text-text-600">
              {user.role?.toLowerCase() || "member"}
            </p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-background-200 bg-primary-700/10 text-xs font-bold text-primary-700">
            {initials(user.name ?? null, user.email ?? "U")}
          </span>
        </div>
      </div>
    </header>
  );
}