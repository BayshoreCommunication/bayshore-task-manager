import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/projects — create a project
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meId = (session.user as any).id as string;

  const {
    name,
    description = "",
    color = "#4f8ef7",
    status = "in_pipeline",
    members = [],
  } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name,
      description,
      color,
      status,
      createdById: meId,
      members: {
        create: (members as string[]).map((userId) => ({ userId })),
      },
    },
    include: {
      members: { select: { userId: true } },
      docs: true,
    },
  });

  return NextResponse.json(
    {
      ...project,
      members: project.members.map((m) => m.userId),
      docs: [],
      createdBy: project.createdById,
      createdAt: project.createdAt.toISOString(),
    },
    { status: 201 },
  );
}
