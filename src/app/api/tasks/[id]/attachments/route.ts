// app/api/tasks/[taskId]/attachments/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 },
      );
    }

    const attachment = await req.json();

    // Validate required attachment fields
    if (
      !attachment.url ||
      !attachment.addedBy ||
      !attachment.type ||
      !attachment.name
    ) {
      return NextResponse.json(
        {
          error: "Missing required attachment fields: url, addedBy, type, name",
        },
        { status: 400 },
      );
    }

    const response = await prisma.attachment.create({
      data: {
        url: attachment.url,
        type: attachment.type,
        name: attachment.name,
        taskId: id,
        addedById: attachment.addedBy,
      },
    });

    return NextResponse.json({ success: true, attachment }, { status: 201 });
  } catch (error) {
    console.error("Failed to add attachment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
