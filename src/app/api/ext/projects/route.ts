import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

// Key-guarded project create for the company portal: when a project is opened there, this mirrors
// it into the task manager as a Project plus a starter Task. Guarded by PORTAL_SSO_KEY; a
// wrong/missing key is 404.
//
//   POST /api/ext/projects   { name, description?, status?, color? }   header x-api-key
//   → { projectId, taskId }

const notFound = () => new NextResponse("Not found", { status: 404 });

const sameKey = (given: string, secret: string) => {
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// Company portal statuses → the task manager's project / task statuses.
const PROJECT_STATUS: Record<string, "in_pipeline" | "active" | "done"> = {
  new: "in_pipeline",
  in_progress: "active",
  completed: "done",
};

export async function POST(req: Request) {
  const secret = (process.env.PORTAL_SSO_KEY ?? "").trim();
  if (!secret) return notFound();

  const url = new URL(req.url);
  const given = (req.headers.get("x-api-key") ?? url.searchParams.get("key") ?? "").trim();
  if (!sameKey(given, secret)) return notFound();

  let body: { name?: unknown; description?: unknown; status?: unknown; color?: unknown; assignees?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  // The task manager user ids to assign the starter task to — kept to real users.
  const wantedIds = Array.isArray(body.assignees) ? [...new Set(body.assignees.map((value) => String(value)))] : [];
  const assigneeIds = wantedIds.length
    ? (await prisma.user.findMany({ where: { id: { in: wantedIds } }, select: { id: true } })).map((user) => user.id)
    : [];

  const description = typeof body.description === "string" ? body.description : "";
  const color = typeof body.color === "string" && body.color ? body.color : "#4f8ef7";
  const projectStatus = PROJECT_STATUS[String(body.status)] ?? "in_pipeline";
  const taskStatus = projectStatus === "done" ? "done" : "pending";

  // The synced project needs an owner — the first admin, or any user.
  const owner = (await prisma.user.findFirst({ where: { role: "admin" }, select: { id: true } })) ?? (await prisma.user.findFirst({ select: { id: true } }));
  if (!owner) return NextResponse.json({ error: "No task-manager user to own the project" }, { status: 409 });

  const project = await prisma.project.create({
    data: {
      name,
      description,
      color,
      status: projectStatus,
      createdById: owner.id,
      members: { create: assigneeIds.map((userId) => ({ userId })) },
    },
    select: { id: true },
  });

  const task = await prisma.task.create({
    data: {
      title: name,
      details: description,
      status: taskStatus,
      projectId: project.id,
      createdById: owner.id,
      assignees: { create: assigneeIds.map((userId) => ({ userId })) },
    },
    select: { id: true },
  });

  return NextResponse.json({ projectId: project.id, taskId: task.id }, { status: 201 });
}
