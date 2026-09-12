"use client";

import Link from "next/link";
import { Search } from "lucide-react";

import { initials } from "@/lib/dashboard/format";

export type MenuBarUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export function MenuBar({ user }: { user: MenuBarUser }) {
  const roleLabel =
    user.role === "CREATOR" ? "Creator Portal" : "Studio Portal";

  function handleSearch(value: string) {
    window.dispatchEvent(
      new CustomEvent<string>("ur:search", { detail: value }),
    );
  }

  return (
    <header className="w-full" data-purpose="main-header">
      <nav
        aria-label="Global Navigation"
        className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200/80 bg-white px-6 py-3 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] md:rounded-full"
      >
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-lg p-0.5 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0a0a0c] text-sm font-extrabold text-white shadow-sm">
              R
            </span>
            <span className="text-lg font-bold tracking-tight text-neutral-950">
              UploadRelay
            </span>
          </Link>
          <div className="hidden items-center gap-6 text-xs font-medium text-neutral-600 lg:flex">
            <Link
              href="/dashboard#library"
              className="smooth-transition hover:text-neutral-950"
            >
              Pipelines
            </Link>
            <Link
              href="/dashboard#activity"
              className="smooth-transition hover:text-neutral-950"
            >
              Documentation
            </Link>
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span>API Operational</span>
            </span>
          </div>
        </div>

        <div className="mx-4 hidden max-w-lg flex-1 md:block">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
              <Search className="h-4 w-4" aria-hidden="true" />
            </div>
            <input
              type="search"
              placeholder="Search master cuts, staging packages, tags..."
              onChange={(e) => handleSearch(e.target.value)}
              className="smooth-transition w-full rounded-full border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-xs text-neutral-800 placeholder-neutral-400 hover:bg-neutral-100/70 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden border border-neutral-200/60 bg-neutral-100 px-3.5 py-1.5 font-mono text-xs font-medium text-neutral-600 sm:inline-block rounded-full">
            {roleLabel}
          </span>
          <div
            className="group flex cursor-pointer items-center gap-2"
            title={user.email ?? "Account settings"}
          >
            <div className="smooth-transition flex h-9 w-9 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950 text-xs font-bold text-white group-hover:bg-neutral-800">
              {initials(user.name ?? null, user.email ?? "U")}
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-1 mt-3 md:hidden">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
            <Search className="h-4 w-4" aria-hidden="true" />
          </div>
          <input
            type="search"
            placeholder="Search master cuts..."
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-xs text-neutral-800 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>
      </div>
    </header>
  );
}
