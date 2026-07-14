import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/monthly/[id]/complete — toggle monthly completion for a user+month
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { userId, month } = await req.json();

  if (!userId || !month) {
    return NextResponse.json(
      { error: "userId and month are required" },
      { status: 400 },
    );
  }

  const existing = await prisma.monthlyCompletion.findUnique({
    where: {
      monthlyTaskId_userId_month: {
        monthlyTaskId: id,
        userId,
        month,
      },
    },
  });

  if (existing) {
    // Already done → unmark
    await prisma.monthlyCompletion.delete({ where: { id: existing.id } });
    return NextResponse.json({ completed: false });
  }

  // Not done → mark complete
  const completion = await prisma.monthlyCompletion.create({
    data: { monthlyTaskId: id, userId, month },
  });

  return NextResponse.json({
    completed: true,
    at: completion.completedAt.toISOString(),
  });
}
