import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    //handle role permission
    const { role } = await request.json();
    //save to database
    await prisma.rolePermission.create({
      data: {
        role,
      },
    });

    return NextResponse.json({ message: "Permissions updated successfully" });
  } catch (error) {
    console.error("Error updating permissions:", error);
    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const permissions = await prisma.rolePermission.findMany();
  return NextResponse.json(permissions);
}
