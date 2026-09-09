"use client";

import type { ReactNode } from "react";

import { UploadDialogProvider } from "@/components/upload/upload-dialog-context";
import { MenuBar } from "./menu-bar";
import type { MenuBarUser } from "./menu-bar";

export function DashboardShell({
  user,
  children,
}: {
  user: MenuBarUser;
  children: ReactNode;
}) {
  return (
    <UploadDialogProvider>
      <MenuBar user={user} />
      {children}
    </UploadDialogProvider>
  );
}