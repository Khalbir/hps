import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect Admin Dashboard routes
  if (pathname.startsWith("/admin/dashboard")) {
    const adminCookie = request.cookies.get("handyhub_admin_session")?.value;

    if (!adminCookie) {
      const loginUrl = new URL("/admin", request.url);
      loginUrl.searchParams.set("unauthorized", "1");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};
