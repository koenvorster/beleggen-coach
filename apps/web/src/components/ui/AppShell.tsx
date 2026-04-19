"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp } from "lucide-react";
import NavLinks from "./NavLinks";
import UserAuthButton from "./UserAuthButton";
import AdminNavLink from "./AdminNavLink";

/** Routes that opt-out of the global header / footer / container. */
const AUTH_PATHS = ["/sign-in", "/sign-up"];

interface AppShellProps {
  children: React.ReactNode;
  authEnabled: boolean;
}

/**
 * Renders the global header + constrained <main> + footer for regular pages.
 * Auth pages (/sign-in, /sign-up) receive a bare wrapper so they can own
 * their full-viewport layout.
 */
export default function AppShell({ children, authEnabled }: AppShellProps) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  /* ── Auth pages: no chrome, no container ──────────────────────────────── */
  if (isAuthPage) {
    return <div className="min-h-screen">{children}</div>;
  }

  /* ── Main app shell ────────────────────────────────────────────────────── */
  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-primary-600 text-lg"
          >
            <TrendingUp className="w-5 h-5" />
            <span>BeleggenCoach</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <NavLinks />
            {authEnabled && <AdminNavLink />}
            {authEnabled && <UserAuthButton />}
            <Link href="/onboarding" className="btn-primary text-sm py-2 px-4">
              Beginnen
            </Link>
          </nav>

          {/* Mobile nav */}
          <nav className="flex sm:hidden items-center gap-3 text-sm">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-primary-600"
            >
              Dashboard
            </Link>
            {authEnabled && <UserAuthButton />}
            <Link href="/onboarding" className="btn-primary text-sm py-2 px-3">
              Start
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>

      <footer className="border-t border-gray-100 mt-16 py-8 text-center text-sm text-gray-400">
        <p>
          © 2026 BeleggenCoach · Geen financieel advies ·{" "}
          <Link
            href="/disclaimer"
            className="hover:text-gray-600 underline underline-offset-2"
          >
            Zie onze disclaimer
          </Link>
        </p>
      </footer>
    </>
  );
}
