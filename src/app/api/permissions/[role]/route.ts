import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Permission key mapping: frontend snake_case → Prisma camelCase
const KEY_MAP: Record<string, string> = {
  create_task: "createTask",
  edit_task: "editTask",
  update_status: "updateStatus",
  create_account: "createAccount",
  view_reports: "viewReports",
  view_kpi: "viewKpi",
  view_universal: "viewUniversal",
  view_daily_reports: "viewDailyReports",
  view_vault: "viewVault",
  manage_vault: "manageVault",
  manage_permissions: "managePermissions",
};

// PATCH /api/permissions/[role] — toggle one or more permission keys for a role
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ role: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { role } = await params;

  if (role === "admin") {
    return NextResponse.json(
      { error: "Admin permissions cannot be changed" },
      { status: 403 },
    );
  }

  const body = await req.json(); // e.g. { create_task: true }

  // Translate keys
  const data: Record<string, boolean> = {};
  for (const [frontendKey, value] of Object.entries(body)) {
    const prismaKey = KEY_MAP[frontendKey];
    if (prismaKey) data[prismaKey] = value as boolean;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No valid keys provided" },
      { status: 400 },
    );
  }

  const updated = await prisma.rolePermission.upsert({
    where: { role: role as any },
    create: { role: role as any, ...data },
    update: data,
  });

  // Return in frontend format
  return NextResponse.json({
    role: updated.role,
    create_task: updated.createTask,
    edit_task: updated.editTask,
    update_status: updated.updateStatus,
    create_account: updated.createAccount,
    view_reports: updated.viewReports,
    view_kpi: updated.viewKpi,
    view_universal: updated.viewUniversal,
    view_daily_reports: updated.viewDailyReports,
    view_vault: updated.viewVault,
    manage_vault: updated.manageVault,
    manage_permissions: updated.managePermissions,
  });
}
