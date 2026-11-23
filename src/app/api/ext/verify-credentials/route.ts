import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// Key-guarded credential check for the company portal's backend: it sends an email + password here,
// this verifies them against the task manager's own users (bcrypt), and answers who the user is —
// so a task-manager account can sign in to the company portal without a second password.
//
// Guarded by PORTAL_SSO_KEY: a wrong/missing key is 404 (hidden from scanners). A wrong email or
// password is a generic 401 — the key holder learns nothing about which accounts exist.
//
//   POST /api/ext/verify-credentials      { email, password }
//   header x-api-key: <PORTAL_SSO_KEY>    (or ?key= on the URL)

const notFound = () => new NextResponse("Not found", { status: 404 });

const sameKey = (given: string, secret: string) => {
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export async function POST(req: Request) {
  const secret = (process.env.PORTAL_SSO_KEY ?? "").trim();
  if (!secret) return notFound();

  const url = new URL(req.url);
  const given = (req.headers.get("x-api-key") ?? url.searchParams.get("key") ?? "").trim();
  if (!sameKey(given, secret)) return notFound();

  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Same generic answer whether the account is missing, muted, or the password is wrong.
  if (!user || user.muted || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar ?? null,
    },
  });
}
