import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

// ── Cloudinary config ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

type CloudinaryResult = {
  secure_url: string;
  public_id: string;
  bytes: number;
  format: string;
  resource_type: string;
};

async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string,
  mimeType: string,
): Promise<CloudinaryResult> {
  return new Promise((resolve, reject) => {
    const isPdf = mimeType === "application/pdf";
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        format: isPdf ? "pdf" : undefined,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        ...(isPdf && {
          flags: "attachment",
        }),
      },
      (error, result) => {
        if (error || !result)
          return reject(error ?? new Error("Upload failed"));
        resolve(result as CloudinaryResult);
      },
    );

    stream.end(buffer);
  });
}

function getMimeType(file: File): string {
  return file.type || "application/octet-stream";
}

function getAttachmentType(mimeType: string): "image" | "pdf" | "link" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return "link";
}

// ── POST /api/upload ──────────────────────────────────────────────────────────
//
// FormData fields:
//   file      — the file blob (required)
//   taskId    — attach to a task (one of taskId or projectId required)
//   projectId — attach to a project doc
//   name      — optional display name (falls back to original filename)
//
// Returns a shaped Attachment or ProjectDoc object ready for the store.

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meId = (session.user as any).id as string;

  // ── Parse multipart form ───────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const taskId = formData.get("taskId") as string | null;
  const customName = formData.get("name") as string | null;

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (!taskId) {
    return NextResponse.json(
      { error: "Either taskId is required" },
      { status: 400 },
    );
  }

  const mimeType = getMimeType(file);
  const attachmentType = getAttachmentType(mimeType);
  const displayName = customName || file.name;

  // Only allow image and PDF uploads
  if (attachmentType === "link") {
    return NextResponse.json(
      { error: "Only image and PDF files are supported" },
      { status: 400 },
    );
  }

  // ── File size guard (10 MB) ────────────────────────────────────────────────
  const MAX_BYTES = 10 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10 MB." },
      { status: 413 },
    );
  }

  // ── Upload to Cloudinary ───────────────────────────────────────────────────
  const buffer = Buffer.from(await file.arrayBuffer());
  const folder = `bayshore/tasks/${taskId}`;

  let cloudResult: CloudinaryResult;
  try {
    cloudResult = await uploadToCloudinary(buffer, file.name, folder, mimeType);
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return NextResponse.json({ error: "File upload failed" }, { status: 502 });
  }
  // ── Save to DB and return ──────────────────────────────────────────────────

  // Task attachment
  if (taskId) {
    // Verify task exists
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const attachment = await prisma.attachment.create({
      data: {
        type: attachmentType,
        name: displayName,
        url: cloudResult.secure_url,
        fileKey: cloudResult.public_id,
        mimeType,
        sizeBytes: cloudResult.bytes,
        taskId,
        addedById: meId,
      },
    });

    return NextResponse.json(
      {
        id: attachment.id,
        type: attachment.type,
        name: attachment.name,
        url: attachment.url,
        fileKey: attachment.fileKey,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        addedBy: attachment.addedById,
        at: attachment.createdAt.toISOString(),
        taskId,
      },
      { status: 201 },
    );
  }

  //   // Project doc
  //   if (projectId) {
  //     // Verify project exists
  //     const project = await prisma.project.findUnique({
  //       where: { id: projectId },
  //     });
  //     if (!project) {
  //       return NextResponse.json({ error: "Project not found" }, { status: 404 });
  //     }

  //     const doc = await prisma.projectDoc.create({
  //       data: {
  //         type: attachmentType,
  //         name: displayName,
  //         url: cloudResult.secure_url,
  //         fileKey: cloudResult.public_id,
  //         mimeType,
  //         sizeBytes: cloudResult.bytes,
  //         projectId,
  //         addedById: meId,
  //       },
  //     });

  //     return NextResponse.json(
  //       {
  //         id: doc.id,
  //         type: doc.type,
  //         name: doc.name,
  //         url: doc.url,
  //         fileKey: doc.fileKey,
  //         mimeType: doc.mimeType,
  //         sizeBytes: doc.sizeBytes,
  //         addedBy: doc.addedById,
  //         at: doc.createdAt.toISOString(),
  //         projectId,
  //       },
  //       { status: 201 },
  //     );
  //  }
}

// ── DELETE /api/upload?fileKey=... ────────────────────────────────────────────
//
// Deletes a file from Cloudinary and its DB record.
// Query params:
//   fileKey      — Cloudinary public_id (required)
//   attachmentId — DB id if it's a task attachment
//   docId        — DB id if it's a project doc

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileKey = searchParams.get("fileKey");
  const attachmentId = searchParams.get("attachmentId");
  const docId = searchParams.get("docId");

  if (!fileKey) {
    return NextResponse.json({ error: "fileKey is required" }, { status: 400 });
  }

  // Delete from Cloudinary
  try {
    // Determine resource type from the key prefix/folder
    const resourceType = fileKey.includes("/pdf/") ? "raw" : "image";
    await cloudinary.uploader.destroy(fileKey, { resource_type: resourceType });
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    // Don't hard-fail — still clean up the DB record
  }

  // Delete DB record
  if (attachmentId) {
    await prisma.attachment
      .delete({ where: { id: attachmentId } })
      .catch(() => null);
  }
  if (docId) {
    await prisma.projectDoc.delete({ where: { id: docId } }).catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
