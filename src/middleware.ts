// Middleware — adds X-Response-Time and CORS headers for API routes

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const start = Date.now();
  const response = NextResponse.next();

  // Response time header for all API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("X-Response-Time", `${Date.now() - start}ms`);

    // CORS — allow the LiveActivityFeed to poll from any origin
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
