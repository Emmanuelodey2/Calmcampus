// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage   = pathname.startsWith("/login");
  const isProtected  = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  // Unauthenticated user trying to access a protected route → redirect to login
  if (!token && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged-in user trying to view the login page → redirect to dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/admin"],
};