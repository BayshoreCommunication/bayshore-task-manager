import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/vault/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { password, accessList, ...rest } = await req.json();

  const entry = await prisma.vaultEntry.update({
    where: { id },
    data: {
      ...rest,
      ...(password !== undefined && { passwordEnc: password }), // ← encrypt in production
      ...(accessList !== undefined && {
        accessList: {
          deleteMany: {},
          create: (accessList as string[]).map((userId) => ({ userId })),
        },
      }),
    },
    include: { accessList: { select: { userId: true } } },
  });

  return NextResponse.json({
    ...entry,
    password: entry.passwordEnc,
    accessList: entry.accessList.map((a) => a.userId),
    createdBy: entry.createdById,
    createdAt: entry.createdAt.toISOString(),
  });
}

// DELETE /api/vault/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.vaultEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
