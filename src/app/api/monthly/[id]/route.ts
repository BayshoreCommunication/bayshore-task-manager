import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/monthly/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { assignees, ...rest } = await req.json();

  const task = await prisma.monthlyTask.update({
    where: { id },
    data: {
      ...rest,
      ...(assignees !== undefined && {
        assignees: {
          deleteMany: {},
          create: (assignees as string[]).map((userId) => ({ userId })),
        },
      }),
    },
    include: {
      assignees: { select: { userId: true } },
      completions: true,
    },
  });

  return NextResponse.json({
    ...task,
    assignees: task.assignees.map((a) => a.userId),
    completions: task.completions.map((c) => ({
      userId: c.userId,
      month: c.month,
      at: c.completedAt.toISOString(),
    })),
    createdBy: task.createdById,
    createdAt: task.createdAt.toISOString(),
  });
}

// DELETE /api/monthly/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.monthlyTask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
