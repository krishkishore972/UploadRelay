"use client";

import type { ReactNode } from "react";

import { UploadDialogProvider } from "@/components/upload/upload-dialog-context";
import { MenuBar } from "./menu-bar";
import type { MenuBarUser } from "./menu-bar";
import { DashboardSidebar } from "./dashboard-sidebar";

export function DashboardShell({
  user,
  children,
}: {
  user: MenuBarUser;
  children: ReactNode;
}) {
  return (
    <UploadDialogProvider>
      <div className="min-h-screen bg-[#fbf9f9] text-neutral-950 selection:bg-neutral-900 selection:text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col gap-6 p-4 md:p-6 lg:px-10 lg:py-6">
          <MenuBar user={user} />
          <div
            className="grid flex-1 grid-cols-1 items-start gap-6 lg:grid-cols-12"
            data-purpose="dashboard-body"
          >
            <DashboardSidebar user={user} />
            <div className="min-w-0 lg:col-span-9">{children}</div>
          </div>
        </div>
      </div>
    </UploadDialogProvider>
  );
}
