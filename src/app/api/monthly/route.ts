import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/monthly — create a monthly task
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meId = (session.user as any).id as string;

  const {
    title,
    details = "",
    dueDay,
    priority = "medium",
    assignees = [],
    muted = false,
  } = await req.json();

  if (!title || dueDay === undefined) {
    return NextResponse.json(
      { error: "title and dueDay are required" },
      { status: 400 },
    );
  }

  const task = await prisma.monthlyTask.create({
    data: {
      title,
      details,
      dueDay,
      priority,
      muted,
      createdById: meId,
      assignees: {
        create: (assignees as string[]).map((userId) => ({ userId })),
      },
    },
    include: {
      assignees: { select: { userId: true } },
      completions: true,
    },
  });

  return NextResponse.json(
    {
      ...task,
      assignees: task.assignees.map((a) => a.userId),
      completions: task.completions.map((c) => ({
        userId: c.userId,
        month: c.month,
        at: c.completedAt.toISOString(),
      })),
      createdBy: task.createdById,
      createdAt: task.createdAt.toISOString(),
    },
    { status: 201 },
  );
}
