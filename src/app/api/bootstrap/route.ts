import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  console.log("Session in API route:", session);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meId = (session.user as any).id as string;

  const [
    me,
    users,
    tasks,
    notifications,
    dailyReports,
    rolePermissions,
    appSettings,
    vault,
    monthly,
    projects,
    log,
  ] = await Promise.all([
    // Current user
    prisma.user.findUnique({
      where: { id: meId },
      omit: { password: true },
    }),

    // All users (omit password hashes)
    prisma.user.findMany({
      omit: { password: true },
      orderBy: { name: "asc" },
    }),

    // Tasks with assignees, comments, attachments
    prisma.task.findMany({
      include: {
        assignees: { select: { userId: true } },
        comments: {
          include: { attachments: true },
          orderBy: { createdAt: "asc" },
        },
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    // Notifications for this user only
    prisma.notification.findMany({
      where: { targetUserId: meId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),

    // Daily reports
    prisma.dailyReport.findMany({
      orderBy: { date: "desc" },
      include: { hours: true },
    }),

    // Role permissions
    prisma.rolePermission.findMany(),

    // App settings / brand
    prisma.appSettings.findUnique({ where: { id: "singleton" } }),

    // Vault entries with access list
    prisma.vaultEntry.findMany({
      include: { accessList: { select: { userId: true } } },
      orderBy: { createdAt: "desc" },
    }),

    // Monthly tasks with assignees and completions
    prisma.monthlyTask.findMany({
      include: {
        assignees: { select: { userId: true } },
        completions: true,
      },
      orderBy: { createdAt: "asc" },
    }),

    // Projects with members and docs
    prisma.project.findMany({
      include: {
        members: { select: { userId: true } },
        docs: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    // Activity log (latest 1000)
    prisma.logEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
  ]);

  // ── Shape data to match frontend types ──────────────────────────────────────

  const shapedTasks = tasks.map((t) => ({
    ...t,
    assignees: t.assignees.map((a) => a.userId),
    comments: t.comments.map((c) => ({
      ...c,
      at: c.createdAt.toISOString(),
      attachments: c.attachments.map((a) => ({ url: a.url })),
    })),
    attachments: t.attachments.map((a) => ({
      ...a,
      addedBy: a.addedById,
      at: a.createdAt.toISOString(),
    })),
    createdBy: t.createdById,
    createdAt: t.createdAt.toISOString(),
    dueDate: t.dueDate?.toISOString() ?? "",
    completedAt: t.completedAt?.toISOString() ?? null,
  }));

  const shapedMonthly = monthly.map((m) => ({
    ...m,
    assignees: m.assignees.map((a) => a.userId),
    completions: m.completions.map((c) => ({
      userId: c.userId,
      month: c.month,
      at: c.completedAt.toISOString(),
    })),
    createdBy: m.createdById,
    createdAt: m.createdAt.toISOString(),
  }));

  const shapedProjects = projects.map((p) => ({
    ...p,
    members: p.members.map((m) => m.userId),
    docs: p.docs.map((d) => ({
      ...d,
      addedBy: d.addedById,
      at: d.createdAt.toISOString(),
    })),
    createdBy: p.createdById,
    createdAt: p.createdAt.toISOString(),
  }));

  const shapedVault = vault.map((v) => ({
    ...v,
    password: v.passwordEnc, // decryption should happen here in production
    accessList: v.accessList.map((a) => a.userId),
    createdBy: v.createdById,
    createdAt: v.createdAt.toISOString(),
  }));

  // Build PermissionsMap keyed by role
  const permissions = Object.fromEntries(
    rolePermissions.map((rp) => [
      rp.role,
      {
        create_task: rp.createTask,
        edit_task: rp.editTask,
        update_status: rp.updateStatus,
        create_account: rp.createAccount,
        view_reports: rp.viewReports,
        view_kpi: rp.viewKpi,
        view_universal: rp.viewUniversal,
        view_daily_reports: rp.viewDailyReports,
        view_vault: rp.viewVault,
        manage_vault: rp.manageVault,
        manage_permissions: rp.managePermissions,
      },
    ]),
  );

  const brand = {
    name: appSettings?.appName ?? "Bayshore OS",
    logo: appSettings?.logoUrl ?? null,
  };

  return NextResponse.json({
    me,
    users,
    tasks: shapedTasks,
    notifications,
    dailyReports: dailyReports.map((r) => ({
      ...r,
      date: r.date.toISOString(),
      at: r.createdAt.toISOString(),
    })),
    permissions,
    brand,
    vault: shapedVault,
    monthly: shapedMonthly,
    projects: shapedProjects,
    log: log.map((l) => ({
      ...l,
      at: l.createdAt.toISOString(),
    })),
  });
}
