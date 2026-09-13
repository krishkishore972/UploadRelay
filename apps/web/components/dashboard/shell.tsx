"use client";

import { useState, type ReactNode } from "react";

import { UploadDialogProvider } from "@/components/upload/upload-dialog-context";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <UploadDialogProvider>
      <TooltipProvider>
        <div className="flex h-svh flex-col overflow-hidden bg-[#fafafa] text-neutral-950 antialiased selection:bg-neutral-900 selection:text-white">
          <div className="mx-auto flex h-full min-h-0 w-full max-w-[1680px] flex-col gap-5 px-4 py-4 md:px-6 lg:px-10 lg:py-6">
            <MenuBar
              user={user}
              mobileOpen={mobileOpen}
              onMobileOpenChange={setMobileOpen}
            />
            <div
              className="grid min-h-0 flex-1 grid-cols-1 gap-6 pb-1 lg:grid-cols-12"
              data-purpose="dashboard-body"
            >
              <DashboardSidebar user={user} />
              <main className="min-h-0 min-w-0 overflow-y-auto pb-8 lg:col-span-9">
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </div>
      </TooltipProvider>
    </UploadDialogProvider>
  );
}
