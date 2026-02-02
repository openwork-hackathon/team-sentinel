// Middleware — response time, CORS, and CDN cache-busting for API routes
//
// Prevents Vercel CDN from caching 404/error responses by setting
// Vercel-CDN-Cache-Control: no-store as default. Individual route
// handlers can override with their own Cache-Control for 200 responses.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const start = Date.now();
  const response = NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("X-Response-Time", `${Date.now() - start}ms`);

    // CORS — allow LiveActivityFeed polling from any origin
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    // Prevent Vercel CDN from caching error responses (404/500).
    // Route handlers set their own Cache-Control for successful responses,
    // which the CDN will respect. This is a safety net for error pages.
    response.headers.set("Vercel-CDN-Cache-Control", "no-store");
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
