import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "login";
  const role = searchParams.get("role") || "CUSTOMER";

  // Demo Google One-Click OAuth Login URL generator
  const googleClientId = process.env.GOOGLE_CLIENT_ID || "mock_google_client_id.apps.googleusercontent.com";
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`;

  // Simulated Google Auth OAuth Flow for dev environment
  const targetRedirect = action === "register" && role === "PROFESSIONAL"
    ? "/pro/verification"
    : "/dashboard";

  // Returns OAuth authorization URL or direct dev sign-in session
  return NextResponse.redirect(
    new URL(`${targetRedirect}?gmail=true&name=Google+User&email=khalid.google@gmail.com`, request.url)
  );
}
