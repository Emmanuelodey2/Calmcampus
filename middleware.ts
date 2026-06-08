// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access")?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith("/login");

  // If no token and trying to access dashboard → redirect
  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If logged in and trying to access login → redirect to dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}
// middleware.ts
export const config = {
  matcher: ["/dashboard/:path*"],
};