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

export default async function middleware(req: NextRequest) {
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

