import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

// Key-guarded team list for the company portal: every non-muted team member with their name,
// email, role and avatar — so a client can pick who they want on a meeting. Guarded by
// PORTAL_SSO_KEY (same as verify-credentials); a wrong/missing key is 404.
//
//   GET /api/ext/team      header x-api-key: <PORTAL_SSO_KEY>   (or ?key=)

const notFound = () => new NextResponse("Not found", { status: 404 });

const sameKey = (given: string, secret: string) => {
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export async function GET(req: Request) {
  const secret = (process.env.PORTAL_SSO_KEY ?? "").trim();
  if (!secret) return notFound();

  const url = new URL(req.url);
  const given = (req.headers.get("x-api-key") ?? url.searchParams.get("key") ?? "").trim();
  if (!sameKey(given, secret)) return notFound();

  const users = await prisma.user.findMany({
    where: { muted: false },
    select: { id: true, name: true, email: true, role: true, avatar: true, designation: true, department: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    members: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar ?? null,
      designation: u.designation ?? "",
      department: u.department ?? "",
    })),
  });
}
