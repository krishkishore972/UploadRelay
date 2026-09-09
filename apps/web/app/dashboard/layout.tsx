import type { ReactNode } from "react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/auth";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <DashboardShell
      user={{
        name: user?.name ?? null,
        email: user?.email ?? null,
        role: user?.role ?? null,
      }}
    >
      {children}
    </DashboardShell>
  );
}