"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ETFCard from "@/components/etf/ETFCard";
import { Search, GitCompareArrows } from "lucide-react";
import { toETFCardProps, type BackendETF } from "@/lib/api";
import { useWatchlist } from "@/lib/use-watchlist";

const CATEGORIES = [
  "Alle",
  "Aandelen Wereld",
  "Aandelen VS",
  "Aandelen EM",
  "Aandelen Europa",
  "Obligaties",
];

interface ETFListClientProps {
  etfs: BackendETF[];
  activeCategoryParam: string;
  maxTerParam: string;
}

export default function ETFListClient({
  etfs,
  activeCategoryParam,
  maxTerParam,
}: ETFListClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [compareList, setCompareList] = useState<string[]>([]);
  const { toggle, isInWatchlist } = useWatchlist();

  const filtered = etfs.filter((etf) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      etf.ticker.toLowerCase().includes(q) ||
      (etf.naam ?? "").toLowerCase().includes(q)
    );
  });

  const handleCategoryChange = (cat: string) => {
    const parts: string[] = [];
    if (cat !== "Alle") parts.push(`categorie=${encodeURIComponent(cat)}`);
    if (maxTerParam) parts.push(`max_ter=${encodeURIComponent(maxTerParam)}`);
    const qs = parts.join("&");
    router.push(qs ? `/etfs?${qs}` : "/etfs");
  };

  const handleCompare = (ticker: string) => {
    setCompareList((prev) => {
      if (prev.includes(ticker)) return prev.filter((t) => t !== ticker);
      if (prev.length >= 3) return prev;
      return [...prev, ticker];
    });
  };

  const handleGoCompare = () => {
    const params = compareList.map((t, i) => `${"abc"[i]}=${t}`).join("&");
    router.push(`/etfs/compare?${params}`);
  };

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek op naam of ticker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                (cat === "Alle" && !activeCategoryParam) || activeCategoryParam === cat
                  ? "bg-primary-500 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-primary-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ETF grid */}
      {filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((etf) => (
            <ETFCard
              key={etf.isin}
              {...toETFCardProps(etf)}
              onCompare={handleCompare}
              compareSelected={compareList.includes(etf.ticker)}
              onWatchlist={toggle}
              watchlistActive={isInWatchlist(etf.isin)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Geen ETF&apos;s gevonden</p>
          <p className="text-sm mt-1">Probeer een andere zoekterm of categorie.</p>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Bronnen: ETF-gegevens zijn indicatief en worden niet real-time bijgewerkt.
        TER = Total Expense Ratio (jaarlijkse kosten).
      </p>

      {/* Vergelijk sticky bar */}
      {compareList.length >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-700 text-sm font-medium">
              <GitCompareArrows className="w-5 h-5 text-primary-600" />
              <span>
                {compareList.length} ETF&apos;s geselecteerd:{" "}
                <strong>{compareList.join(", ")}</strong>
              </span>
            </div>
            <button onClick={handleGoCompare} className="btn-primary text-sm py-2 px-4">
              Vergelijk nu →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
