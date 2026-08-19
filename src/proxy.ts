import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Protect Admin Dashboard routes
  if (pathname.startsWith("/admin/dashboard")) {
    const adminCookie = request.cookies.get("handyhub_admin_session")?.value;
    const userDataCookie = request.cookies.get("handyhub_user_data")?.value;

    let isAdmin = Boolean(adminCookie);
    if (!isAdmin && userDataCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userDataCookie));
        if (["SUPER_ADMIN", "ADMIN", "OPERATIONS_MANAGER", "VERIFICATION_OFFICER", "CUSTOMER_SUPPORT", "FINANCE"].includes(parsed.role)) {
          isAdmin = true;
        }
      } catch {}
    }

    if (!isAdmin) {
      const loginUrl = new URL("/admin", request.url);
      loginUrl.searchParams.set("unauthorized", "1");
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protect Customer Dashboard routes
  // (Both standard Customers and Artisans switching to Client Mode can access /dashboard)
  if (pathname.startsWith("/dashboard")) {
    const userCookie = request.cookies.get("handyhub_user_session")?.value;
    const proCookie = request.cookies.get("handyhub_pro_session")?.value;
    const userDataCookie = request.cookies.get("handyhub_user_data")?.value;

    if (!userCookie && !proCookie && !userDataCookie) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Protect Professional Portal routes
  // (Only verified Professionals can access /pro; standard Clients CANNOT switch to Pro)
  if (pathname.startsWith("/pro")) {
    const proCookie = request.cookies.get("handyhub_pro_session")?.value;
    const userCookie = request.cookies.get("handyhub_user_session")?.value;
    const userDataCookie = request.cookies.get("handyhub_user_data")?.value;

    let isPro = Boolean(proCookie);
    let isCustomer = Boolean(userCookie);

    if (userDataCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userDataCookie));
        if (parsed.role === "PROFESSIONAL" || parsed.isProfessional === true) {
          isPro = true;
        } else if (parsed.role === "CUSTOMER") {
          isCustomer = true;
        }
      } catch {}
    }

    if (!isPro) {
      // If user is a Customer, redirect to client dashboard with explanatory notice
      if (isCustomer) {
        const dashboardUrl = new URL("/dashboard", request.url);
        dashboardUrl.searchParams.set("notice", "client_cannot_access_pro");
        return NextResponse.redirect(dashboardUrl);
      }

      // Not logged in at all -> redirect to login
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
