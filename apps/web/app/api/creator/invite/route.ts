import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { authOptions } from "@/app/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, inviteCode: true },
  });
  if (!me || me.role !== "CREATOR") {
    return NextResponse.json({ error: "Creators only" }, { status: 403 });
  }
  return NextResponse.json({ inviteCode: me.inviteCode });
}
