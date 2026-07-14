import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/vault — create a vault entry
// NOTE: In production, encrypt `password` with AES-256 before storing.
//       Here we store it as-is to match the current type shape.
//       Replace: passwordEnc = encrypt(password)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meId = (session.user as any).id as string;

  const {
    client,
    platform,
    username,
    password,
    url = "",
    notes = "",
    accessList = [],
  } = await req.json();

  if (!client || !platform || !username || !password) {
    return NextResponse.json(
      { error: "client, platform, username and password are required" },
      { status: 400 },
    );
  }

  const entry = await prisma.vaultEntry.create({
    data: {
      client,
      platform,
      username,
      passwordEnc: password, // ← swap with encrypt(password) in production
      url,
      notes,
      createdById: meId,
      accessList: {
        create: (accessList as string[]).map((userId) => ({ userId })),
      },
    },
    include: { accessList: { select: { userId: true } } },
  });

  return NextResponse.json(
    {
      ...entry,
      password: entry.passwordEnc,
      accessList: entry.accessList.map((a) => a.userId),
      createdBy: entry.createdById,
      createdAt: entry.createdAt.toISOString(),
    },
    { status: 201 },
  );
}
