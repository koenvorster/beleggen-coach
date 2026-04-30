import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/portfolio",
  "/analytics",
  "/checkin",
  "/plan",
  "/admin",
];

const AUTH_ENABLED =
  Boolean(process.env.KEYCLOAK_CLIENT_ID) &&
  Boolean(process.env.KEYCLOAK_CLIENT_SECRET);

const E2E_BYPASS_TOKEN = process.env.E2E_BYPASS_TOKEN;

export default async function middleware(req: NextRequest) {
  // Cypress E2E bypass: laat beschermde routes door als de juiste cookie aanwezig is
  if (E2E_BYPASS_TOKEN) {
    const bypassCookie = req.cookies.get("e2e_auth_bypass");
    if (bypassCookie?.value === E2E_BYPASS_TOKEN) {
      return NextResponse.next();
    }
  }

  if (!AUTH_ENABLED) return NextResponse.next();

  const isProtected = PROTECTED_ROUTES.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );
  if (!isProtected) return NextResponse.next();

  const { auth } = await import("@/_auth_keycloak");
  const session = await auth();
  if (!session) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Sluit api/auth/* uit zodat NextAuth callbacks ongestoord verlopen
  matcher: ["/((?!api/auth|.*\\..*|_next).*)", "/"],
};


