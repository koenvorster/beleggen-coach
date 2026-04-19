import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import NavLinks from "@/components/ui/NavLinks";
import UserAuthButton from "@/components/ui/UserAuthButton";
import AuthProvider from "@/components/providers/AuthProvider";
import { isAuthEnabled } from "@/lib/auth";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Beleggen voor Beginners",
  description: "Jouw persoonlijke beleggingscoach — eenvoudig, helder en op jouw tempo.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authEnabled = isAuthEnabled();
  const session = authEnabled ? await auth() : null;

  const content = (
    <html lang="nl">
      <body className="min-h-screen bg-surface">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-primary-600 text-lg">
              <TrendingUp className="w-5 h-5" />
              <span>BeleggenCoach</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
              <NavLinks />
              {authEnabled && <UserAuthButton />}
              <Link href="/onboarding" className="btn-primary text-sm py-2 px-4">
                Beginnen
              </Link>
            </nav>
            {/* Mobile nav */}
            <nav className="flex sm:hidden items-center gap-3 text-sm">
              <Link href="/dashboard" className="text-gray-600 hover:text-primary-600">Dashboard</Link>
              {authEnabled && <UserAuthButton />}
              <Link href="/onboarding" className="btn-primary text-sm py-2 px-3">
                Start
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-100 mt-16 py-8 text-center text-sm text-gray-400">
          <p>
            © 2026 BeleggenCoach · Geen financieel advies ·{" "}
            <Link href="/disclaimer" className="hover:text-gray-600 underline underline-offset-2">
              Zie onze disclaimer
            </Link>
          </p>
        </footer>
      </body>
    </html>
  );

  return authEnabled ? <AuthProvider session={session}>{content}</AuthProvider> : content;
}

