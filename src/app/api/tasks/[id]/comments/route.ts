import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/tasks/[id]/comments
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: taskId } = await params;
  const meId = (session.user as any).id as string;
  const { text, attachments = [] } = await req.json();

  if (!text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      text,
      taskId,
      userId: meId,
      attachments: {
        create: (attachments as { url: string }[]).map((a) => ({ url: a.url })),
      },
    },
    include: { attachments: true },
  });

  return NextResponse.json(
    {
      id: comment.id,
      text: comment.text,
      userId: comment.userId,
      at: comment.createdAt.toISOString(),
      attachments: comment.attachments.map((a) => ({ url: a.url })),
    },
    { status: 201 },
  );
}
