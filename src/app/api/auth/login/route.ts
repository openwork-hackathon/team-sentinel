export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, AUTH_COOKIE, AUTH_COOKIE_MAX_AGE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = body?.apiKey;

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    const agent = await validateApiKey(apiKey);
    if (!agent) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    // Set httpOnly cookie with the API key
    const res = NextResponse.json({ agent });
    res.cookies.set(AUTH_COOKIE, apiKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
