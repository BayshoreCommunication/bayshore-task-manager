import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { computeKPI } from "@/lib/kpi";
import type { Task, DailyReport, MonthlyTask } from "@/types";

// Key-guarded, read-only team overview for the company portal: each (non-muted) member with their
// name, role, avatar and this month's KPI score — the same numbers the task manager's own dashboard
// shows. No passwords, no other personal data. Guarded by DEBUG_LIST_KEY: a wrong/missing key is 404.
//
//   GET /api/team-overview?key=<DEBUG_LIST_KEY>   (or header x-debug-key)

const notFound = () => new NextResponse("Not found", { status: 404 });

const sameKey = (given: string, secret: string) => {
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export async function GET(req: Request) {
  const secret = (process.env.DEBUG_LIST_KEY ?? "").trim();
  if (!secret) return notFound();

  const url = new URL(req.url);
  const given = (url.searchParams.get("key") ?? req.headers.get("x-debug-key") ?? "").trim();
  if (!sameKey(given, secret)) return notFound();

  const [users, tasksRaw, dailyRaw, monthlyRaw] = await Promise.all([
    prisma.user.findMany({
      where: { muted: false },
      select: { id: true, name: true, role: true, avatar: true },
      orderBy: { name: "asc" },
    }),
    prisma.task.findMany({
      select: { muted: true, status: true, dueDate: true, completedAt: true, assignees: { select: { userId: true } } },
    }),
    prisma.dailyReport.findMany({ select: { userId: true, date: true, createdAt: true } }),
    prisma.monthlyTask.findMany({
      select: { muted: true, assignees: { select: { userId: true } }, completions: { select: { userId: true, month: true } } },
    }),
  ]);

  // Shape to what computeKPI expects (same as the dashboard's bootstrap shaping).
  const tasks = tasksRaw.map((t) => ({
    muted: t.muted,
    status: t.status,
    dueDate: t.dueDate?.toISOString() ?? "",
    completedAt: t.completedAt?.toISOString() ?? null,
    assignees: t.assignees.map((a) => a.userId),
  })) as unknown as Task[];

  const daily = dailyRaw.map((r) => ({
    userId: r.userId,
    date: r.date.toISOString(),
    at: r.createdAt.toISOString(),
  })) as unknown as DailyReport[];

  const monthly = monthlyRaw.map((m) => ({
    muted: m.muted,
    assignees: m.assignees.map((a) => a.userId),
    completions: m.completions.map((c) => ({ userId: c.userId, month: c.month })),
  })) as unknown as MonthlyTask[];

  const members = users.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    avatar: u.avatar ?? null,
    score: computeKPI(u.id, tasks, daily, monthly).ov,
  }));

  return NextResponse.json({ count: members.length, members });
}
