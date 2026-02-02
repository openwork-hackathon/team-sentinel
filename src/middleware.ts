// Middleware — response time, CORS, and CDN cache-busting for ALL routes
//
// Prevents Vercel CDN from caching 404/error responses by setting
// Vercel-CDN-Cache-Control: no-store on every response. This stops
// stale 404s from persisting when new pages are deployed.
// Individual route handlers can still set their own Cache-Control
// for successful responses.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const start = Date.now();
  const response = NextResponse.next();

  // Prevent Vercel CDN from caching 404/error responses on ANY route.
  // Without this, deploying a new page (e.g. /agents) can still show
  // a cached 404 from before the page existed.
  response.headers.set("Vercel-CDN-Cache-Control", "no-store");

  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("X-Response-Time", `${Date.now() - start}ms`);

    // CORS — allow LiveActivityFeed polling from any origin
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
  }

  return response;
}

export const config = {
  // Match all routes except static assets and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
