"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

interface NavCategory {
  category: string;
  items: NavItem[];
  dropdown?: boolean;
}

const NAV_STRUCTURE: NavCategory[] = [
  {
    category: "Essentieel",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "📊" },
      { href: "/plan", label: "Mijn Plan", icon: "📋" },
    ],
  },
  {
    category: "Beleggen",
    dropdown: true,
    items: [
      { href: "/etfs", label: "ETF Explorer", icon: "🔍" },
      { href: "/etfs/compare", label: "ETF's Vergelijken", icon: "⚖️" },
      { href: "/markt", label: "Markt & Koersen", icon: "📈" },
      { href: "/watchlist", label: "Volglijst", icon: "💛" },
      { href: "/portfolio", label: "Portfolio", icon: "💼" },
    ],
  },
  {
    category: "Analyse",
    dropdown: true,
    items: [
      { href: "/analytics/etfs", label: "ETF Prestaties", icon: "📊" },
      { href: "/scenario", label: "Scenario Planner", icon: "🎯" },
      { href: "/fire", label: "FIRE Calculator", icon: "🔥" },
      { href: "/prestaties", label: "Mijn Prestaties", icon: "🏆" },
    ],
  },
  {
    category: "Leren",
    dropdown: true,
    items: [
      { href: "/leren", label: "Leerpad", icon: "📚" },
      { href: "/learn", label: "Leercentrum", icon: "🎓" },
      { href: "/bronnen", label: "Bronnen & Links", icon: "🔗" },
    ],
  },
  {
    category: "Tools",
    dropdown: true,
    items: [
      { href: "/chat", label: "AI Coach", icon: "🤖" },
      { href: "/belasting", label: "Belasting", icon: "💰" },
      { href: "/brokers", label: "Brokers", icon: "🏦" },
    ],
  },
  {
    category: "Check-in",
    items: [
      { href: "/checkin", label: "Maandelijkse Check-in", icon: "✅" },
    ],
  },
];

interface DropdownMenuProps {
  category: NavCategory;
  isOpen: boolean;
  onToggle: () => void;
  pathname: string;
}

function DropdownMenu({
  category,
  isOpen,
  onToggle,
  pathname,
}: DropdownMenuProps) {
  const hasActiveItem = category.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <div className="relative group">
      <button
        onClick={onToggle}
        className={clsx(
          "flex items-center gap-1 hover:text-primary-600 transition-colors",
          hasActiveItem ? "text-primary-600 font-semibold" : "text-gray-600"
        )}
      >
        {category.category}
        <ChevronDown
          size={16}
          className={clsx(
            "transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {category.items.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "block px-4 py-2 hover:bg-primary-50 transition-colors first:rounded-t-lg last:rounded-b-lg",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-primary-50 text-primary-600 font-semibold"
                  : "text-gray-700"
              )}
            >
              <span className="mr-2">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NavLinks() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <nav className="flex flex-wrap items-center gap-6">
      {NAV_STRUCTURE.map((category) => {
        if (!category.dropdown) {
          // Gewone link
          const item = category.items[0];
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`nav-${item.href.replace(/\//g, "")}`}
              className={clsx(
                "flex items-center gap-1 hover:text-primary-600 transition-colors",
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "text-primary-600 font-semibold"
                  : "text-gray-600"
              )}
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </Link>
          );
        } else {
          // Dropdown
          return (
            <DropdownMenu
              key={category.category}
              category={category}
              isOpen={openDropdown === category.category}
              onToggle={() =>
                setOpenDropdown(
                  openDropdown === category.category ? null : category.category
                )
              }
              pathname={pathname}
            />
          );
        }
      })}
    </nav>
  );
}
