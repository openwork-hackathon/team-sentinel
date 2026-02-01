import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, AUTH_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const apiKey = req.cookies.get(AUTH_COOKIE)?.value;

  if (!apiKey) {
    return NextResponse.json({ agent: null });
  }

  const agent = await validateApiKey(apiKey);
  if (!agent) {
    // Cookie exists but key is invalid — clear it
    const res = NextResponse.json({ agent: null });
    res.cookies.set(AUTH_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return res;
  }

  return NextResponse.json({ agent });
}
