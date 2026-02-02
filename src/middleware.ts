import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/", request.url), 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard"],
};
