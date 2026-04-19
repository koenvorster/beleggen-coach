"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/etfs", label: "ETF's" },
  { href: "/markt", label: "Markt" },
  { href: "/plan", label: "Mijn Plan" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/watchlist", label: "Volglijst 💛" },
  { href: "/chat", label: "AI Coach" },
  { href: "/analytics", label: "Analyse" },
  { href: "/analytics/etfs", label: "📊 ETF Analyse" },
  { href: "/leren", label: "Leerpad 🛏️" },
  { href: "/learn", label: "Leercentrum" },
  { href: "/bronnen", label: "Bronnen" },
  { href: "/belasting", label: "🏦 Belasting" },
  { href: "/brokers", label: "🏦 Brokers" },
  { href: "/fire", label: "🔥 FIRE Calculator" },
  { href: "/scenario", label: "📊 Scenario Planner" },
  { href: "/prestaties", label: "🏆 Prestaties" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {NAV_LINKS.map(({ href, label }) => {
        const name = href.replace(/^\//, "").replace(/[^a-z0-9]/gi, "");
        return (
          <Link
            key={href}
            href={href}
            data-testid={`nav-${name}`}
            className={clsx(
              "hover:text-primary-600 transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "text-primary-600 font-semibold"
                : "text-gray-600"
            )}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
