import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/projects/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { members, ...rest } = await req.json();

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...rest,
      ...(members !== undefined && {
        members: {
          deleteMany: {},
          create: (members as string[]).map((userId) => ({ userId })),
        },
      }),
    },
    include: {
      members: { select: { userId: true } },
      docs: true,
    },
  });

  return NextResponse.json({
    ...project,
    members: project.members.map((m) => m.userId),
    docs: project.docs.map((d) => ({
      ...d,
      addedBy: d.addedById,
      at: d.createdAt.toISOString(),
    })),
    createdBy: project.createdById,
    createdAt: project.createdAt.toISOString(),
  });
}

// DELETE /api/projects/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
