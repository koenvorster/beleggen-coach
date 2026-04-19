"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/etfs", label: "ETF's" },
  { href: "/plan", label: "Mijn Plan" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/chat", label: "AI Coach" },
  { href: "/analytics", label: "Analyse" },
  { href: "/learn", label: "Leercentrum" },
  { href: "/bronnen", label: "Bronnen" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {NAV_LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={clsx(
            "hover:text-primary-600 transition-colors",
            pathname === href || pathname.startsWith(href + "/")
              ? "text-primary-600 font-semibold"
              : "text-gray-600"
          )}
        >
          {label}
        </Link>
      ))}
    </>
  );
}
