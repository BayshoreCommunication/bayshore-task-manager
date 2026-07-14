import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/notifications/read-all — mark all notifications read for current user
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meId = (session.user as any).id as string;

  await prisma.notification.updateMany({
    where: { targetUserId: meId, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
