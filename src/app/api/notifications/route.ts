import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/notifications — push a notification to a user
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetUserId, message, linkPage } = await req.json();

  if (!targetUserId || !message) {
    return NextResponse.json(
      { error: "targetUserId and message are required" },
      { status: 400 },
    );
  }

  const notif = await prisma.notification.create({
    data: { targetUserId, message, linkPage },
  });

  return NextResponse.json(
    { ...notif, createdAt: notif.createdAt.toISOString() },
    { status: 201 },
  );
}
