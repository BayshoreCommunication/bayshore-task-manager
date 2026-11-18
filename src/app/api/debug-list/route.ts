import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

// TEMPORARY debug endpoint — a read-only peek at the user/team list, guarded by a secret key.
// It does NOT use the normal login. Instead it checks DEBUG_LIST_KEY: without the right key the
// route answers 404, so it can't be found by scanning. Passwords are never returned.
//
// ⚠️ Remove this route (and the DEBUG_LIST_KEY env var) once you're done testing. Call it as:
//   GET /api/debug-list?key=<DEBUG_LIST_KEY>
// A wrong or missing key, or an unset env var, is a plain 404.
//
// Diagnostic (no secret leaked): GET /api/debug-list?probe=1 → tells whether the env var is set
// and its length, so a trailing space/newline in the dashboard value can be spotted.

const notFound = () => new NextResponse("Not found", { status: 404 });

// Constant-time compare so the key can't be guessed byte by byte from timing.
const sameKey = (given: string, secret: string) => {
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = (process.env.DEBUG_LIST_KEY ?? "").trim();

  // Harmless health check — reveals only whether a key is configured and its length.
  if (url.searchParams.get("probe") === "1") {
    return NextResponse.json({ keyConfigured: secret.length > 0, keyLength: secret.length });
  }

  if (!secret) return notFound();

  const given = (url.searchParams.get("key") ?? req.headers.get("x-debug-key") ?? "").trim();
  if (!sameKey(given, secret)) return notFound();

  const users = await prisma.user.findMany({
    omit: { password: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ count: users.length, users });
}
