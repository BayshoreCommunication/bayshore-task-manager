import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/tasks — create a task
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meId = (session.user as any).id as string;

  const {
    title,
    details = "",
    assignees = [],
    dueDate,
    priority = "medium",
    status = "pending",
    type = "universal",
    projectId = null,
    muted = false,
  } = await req.json();

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      details,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority,
      status,
      type,
      projectId,
      muted,
      createdById: meId,
      assignees: {
        create: (assignees as string[]).map((userId) => ({ userId })),
      },
    },
    include: {
      assignees: { select: { userId: true } },
      comments: true,
      attachments: true,
    },
  });

  return NextResponse.json(
    {
      ...task,
      assignees: task.assignees.map((a) => a.userId),
      createdBy: task.createdById,
      createdAt: task.createdAt.toISOString(),
      dueDate: task.dueDate?.toISOString() ?? "",
      completedAt: task.completedAt?.toISOString() ?? null,
      comments: [],
      attachments: [],
    },
    { status: 201 },
  );
}
