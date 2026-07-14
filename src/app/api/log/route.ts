import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/log — append an activity log entry
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    type,
    message,
    details = "",
    actorId = null,
    ico = "📌",
    taskId = null,
    vaultId = null,
  } = await req.json();

  if (!type || !message) {
    return NextResponse.json(
      { error: "type and message are required" },
      { status: 400 },
    );
  }

  const entry = await prisma.logEntry.create({
    data: { type, message, details, actorId, ico, taskId, vaultId },
  });

  return NextResponse.json(
    {
      ...entry,
      at: entry.createdAt.toISOString(),
    },
    { status: 201 },
  );
}

// GET /api/log — fetch recent log entries (latest 1000)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.logEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  return NextResponse.json(
    entries.map((e) => ({ ...e, at: e.createdAt.toISOString() })),
  );
}
