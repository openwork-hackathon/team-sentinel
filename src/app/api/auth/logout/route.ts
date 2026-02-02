export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, invalidateAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Invalidate cached auth so stale sessions don't linger
  const apiKey = req.cookies.get(AUTH_COOKIE)?.value;
  if (apiKey) invalidateAuth(apiKey);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
