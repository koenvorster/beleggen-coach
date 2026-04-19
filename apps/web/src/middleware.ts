import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/dashboard", "/portfolio", "/analytics", "/checkin", "/plan"];

// Auth is only active when Keycloak env vars are set
const AUTH_ENABLED =
  Boolean(process.env.KEYCLOAK_CLIENT_ID) &&
  Boolean(process.env.KEYCLOAK_CLIENT_SECRET);

export default async function middleware(req: NextRequest) {
  if (!AUTH_ENABLED) return NextResponse.next();

  const isProtected = PROTECTED_ROUTES.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );
  if (!isProtected) return NextResponse.next();

  // Dynamisch importeren zodat NextAuth niet initialiseert bij startup
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session) {
    const signInUrl = new URL("/api/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Sluit /api/auth/* uit — NextAuth moet zijn eigen callback afhandelen
  matcher: ["/((?!api/auth|.*\\..*|_next).*)", "/"],
};

