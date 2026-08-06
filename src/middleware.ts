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

  // Protect Customer Dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const userCookie = request.cookies.get("handyhub_user_session")?.value || request.cookies.get("handyhub_user_data")?.value;

    if (!userCookie) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect Professional Portal routes
  if (pathname.startsWith("/pro")) {
    const proCookie = request.cookies.get("handyhub_pro_session")?.value || request.cookies.get("handyhub_user_data")?.value;

    if (!proCookie) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/dashboard/:path*", "/pro/:path*"],
};
