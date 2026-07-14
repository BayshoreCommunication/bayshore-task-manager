import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meId = (session.user as any).id as string;
  const {
    date,
    content,
    plan = "",
    blockers = "",
    hours = [],
  } = await req.json();

  if (!date || !content) {
    return NextResponse.json(
      { error: "date and content are required" },
      { status: 400 },
    );
  }

  // validate hours
  const validHours = hours.filter(
    (h: any) =>
      typeof h.hour === "number" &&
      h.hour >= 0 &&
      h.hour <= 23 &&
      typeof h.note === "string" &&
      h.note.trim() !== "",
  );

  const report = await prisma.dailyReport.upsert({
    where: { userId_date: { userId: meId, date: new Date(date) } },
    create: {
      userId: meId,
      date: new Date(date),
      content,
      plan,
      blockers,
      hours: {
        create: validHours.map((h: any) => ({
          hour: h.hour,
          note: h.note.trim(),
        })),
      },
    },
    update: {
      content,
      plan,
      blockers,
      hours: {
        // delete all existing hour entries then recreate
        // simplest way to handle edits without diffing
        deleteMany: {},
        create: validHours.map((h: any) => ({
          hour: h.hour,
          note: h.note.trim(),
        })),
      },
    },
    include: { hours: true },
  });

  return NextResponse.json(
    {
      ...report,
      date: report.date.toISOString(),
      at: report.createdAt.toISOString(),
    },
    { status: 201 },
  );
}
