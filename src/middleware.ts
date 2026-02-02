import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Dashboard redirect
  if (request.nextUrl.pathname === "/dashboard") {
    const response = NextResponse.redirect(new URL("/", request.url), 307);
    response.headers.set("Vercel-CDN-Cache-Control", "no-store");
    response.headers.set("CDN-Cache-Control", "no-store");
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  }

  // For all other matched routes: pass through with CDN cache-busting headers
  const response = NextResponse.next();
  response.headers.set("Vercel-CDN-Cache-Control", "no-store");
  response.headers.set("CDN-Cache-Control", "no-store");
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  // Unique header to ensure Vercel treats this as a new response
  response.headers.set("x-sentinel-ts", Date.now().toString());
  return response;
}

export const config = {
  // Match ALL app routes + API routes to prevent stale CDN 404s
  matcher: [
    "/dashboard",
    "/agents",
    "/agents/:path*",
    "/token",
    "/jobs",
    "/jobs/:path*",
    "/leaderboard",
    "/holders",
    "/auth",
    "/api/:path*",
  ],
};
