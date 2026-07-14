import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meId = (session.user as any).id as string;
  const { content, plan, blockers, hours } = await req.json();

  const { id } = await params;

  const existing = await prisma.dailyReport.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.userId !== meId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // validate hours only if provided
  const validHours = Array.isArray(hours)
    ? hours.filter(
        (h: any) =>
          typeof h.hour === "number" &&
          h.hour >= 0 &&
          h.hour <= 23 &&
          typeof h.note === "string" &&
          h.note.trim() !== "",
      )
    : null;

  const report = await prisma.dailyReport.update({
    where: { id },
    data: {
      ...(content !== undefined && { content }),
      ...(plan !== undefined && { plan }),
      ...(blockers !== undefined && { blockers }),
      ...(validHours !== null && {
        hours: {
          deleteMany: {},
          create: validHours.map((h: any) => ({
            hour: h.hour,
            note: h.note.trim(),
          })),
        },
      }),
    },
    include: { hours: true },
  });

  return NextResponse.json({
    ...report,
    date: report.date.toISOString(),
    at: report.createdAt.toISOString(),
  });
}
