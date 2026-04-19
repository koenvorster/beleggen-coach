import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/ui/AppShell";
import AuthProvider from "@/components/providers/AuthProvider";
import { isAuthEnabled } from "@/lib/auth";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "BeleggenCoach – Jouw AI-beleggingscoach",
  description:
    "Jouw persoonlijke beleggingscoach — eenvoudig, helder en op jouw tempo.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authEnabled = isAuthEnabled();
  const session = authEnabled ? await auth() : null;

  const content = (
    <html lang="nl" suppressHydrationWarning>
      <body className="min-h-screen bg-surface">
        <AppShell authEnabled={authEnabled}>{children}</AppShell>
      </body>
    </html>
  );

  return authEnabled ? (
    <AuthProvider session={session}>{content}</AuthProvider>
  ) : (
    content
  );
}

