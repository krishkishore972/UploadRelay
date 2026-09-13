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
        <div className="min-h-svh bg-[#fafafa] text-neutral-950 antialiased selection:bg-neutral-900 selection:text-white">
          <div className="mx-auto flex min-h-svh w-full max-w-[1680px] flex-col gap-5 px-4 py-4 md:px-6 lg:px-10 lg:py-6">
            <MenuBar
              user={user}
              mobileOpen={mobileOpen}
              onMobileOpenChange={setMobileOpen}
            />
            <div
              className="grid flex-1 grid-cols-1 items-start gap-6 lg:grid-cols-12"
              data-purpose="dashboard-body"
            >
              <DashboardSidebar user={user} />
              <div className="min-w-0 lg:col-span-9">{children}</div>
            </div>
          </div>
          <Toaster />
        </div>
      </TooltipProvider>
    </UploadDialogProvider>
  );
}
