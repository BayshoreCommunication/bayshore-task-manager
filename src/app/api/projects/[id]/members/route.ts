import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/projects/[id]/members — toggle a user's membership in a project
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const { id } = await params;
  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId } },
  });

  if (existing) {
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: id, userId } },
    });
    return NextResponse.json({ member: false });
  }

  await prisma.projectMember.create({
    data: { projectId: id, userId },
  });

  return NextResponse.json({ member: true });
}
