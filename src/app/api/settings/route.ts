import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/settings — update brand / app settings
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, logo } = await req.json();

  const settings = await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      appName: name ?? "Bayshore OS",
      logoUrl: logo ?? null,
    },
    update: {
      ...(name !== undefined && { appName: name }),
      ...(logo !== undefined && { logoUrl: logo }),
    },
  });

  return NextResponse.json({
    name: settings.appName,
    logo: settings.logoUrl ?? null,
  });
}

// GET /api/settings
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" },
  });

  return NextResponse.json({
    name: settings?.appName ?? "Bayshore OS",
    logo: settings?.logoUrl ?? null,
  });
}
