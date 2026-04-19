"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AdminNavLink() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.roles?.includes("admin")) return null;

  const isActive = pathname.startsWith("/admin");

  return (
    <Link
      href="/admin/users"
      className={
        isActive
          ? "text-blue-600 font-semibold"
          : "text-gray-600 hover:text-primary-600 transition-colors"
      }
    >
      Beheer
    </Link>
  );
}
