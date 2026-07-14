import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/tasks/[id] — update task fields + reassign assignees
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { assignees, dueDate, completedAt, ...rest } = body;

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...rest,
      ...(dueDate !== undefined && {
        dueDate: dueDate ? new Date(dueDate) : null,
      }),
      ...(completedAt !== undefined && {
        completedAt: completedAt ? new Date(completedAt) : null,
      }),
      // If status flipped to done, stamp completedAt automatically
      ...(rest.status === "done" && { completedAt: new Date() }),
      // Replace assignees wholesale if provided
      ...(assignees !== undefined && {
        assignees: {
          deleteMany: {},
          create: (assignees as string[]).map((userId) => ({ userId })),
        },
      }),
    },
    include: {
      assignees: { select: { userId: true } },
      comments: {
        include: { attachments: true },
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
    },
  });

  return NextResponse.json({
    ...task,
    assignees: task.assignees.map((a) => a.userId),
    createdBy: task.createdById,
    createdAt: task.createdAt.toISOString(),
    dueDate: task.dueDate?.toISOString() ?? "",
    completedAt: task.completedAt?.toISOString() ?? null,
    comments: task.comments.map((c) => ({
      ...c,
      at: c.createdAt.toISOString(),
      attachments: c.attachments.map((a) => ({ url: a.url })),
    })),
    attachments: task.attachments.map((a) => ({
      ...a,
      addedBy: a.addedById,
      at: a.createdAt.toISOString(),
    })),
  });
}

// DELETE /api/tasks/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
