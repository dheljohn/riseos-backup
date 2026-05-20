import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register"];
const PROTECTED_ROUTES = ["/dashboard", "/sleep", "/meals", "/focus"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRefreshToken = request.cookies.has("refreshToken");

  // Root redirect
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(hasRefreshToken ? "/dashboard" : "/login", request.url),
    );
  }

  // Protect dashboard routes — no cookie → send to login
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!hasRefreshToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Auth routes — already has cookie → send to dashboard
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    if (hasRefreshToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, manifest.json, icons (PWA assets)
     * - /api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|api).*)",
  ],
};
