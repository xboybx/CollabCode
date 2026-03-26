// client/proxy.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// In Next.js 16, this must be an exact exported function named "proxy"!
export default async function proxy(req: NextRequest) {
  // 1. Manually check the browser's cookies for the encrypted "next-auth.session-token"
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // 2. If the VIP Guest does NOT have a token, hijack the request and redirect them!
  if (!token) {
    // We generate a URL that points straight to the NextAuth login page
    const loginUrl = new URL("/api/auth/signin", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 3. If they DO have a token, step aside and let them into the Dashboard!
  return NextResponse.next();
}

export const config = {
  // This is still our VIP List!
  matcher: [
    "/dashboard",
    "/room/:path*"
  ]
}
