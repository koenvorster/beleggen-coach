"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ETFCard from "@/components/etf/ETFCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { Search, GitCompareArrows } from "lucide-react";
import { api, toETFCardProps, type BackendETF } from "@/lib/api";

const CATEGORIES = [
  "Alle",
  "Aandelen Wereld",
  "Aandelen VS",
  "Aandelen EM",
  "Aandelen Europa",
  "Obligaties",
];

export default function ETFsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Alle");
  const [compareList, setCompareList] = useState<string[]>([]);

  const [etfs, setEtfs] = useState<BackendETF[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.etfs
      .list()
      .then((data) => {
        if (!cancelled) {
          setEtfs(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Backend niet bereikbaar — probeer later opnieuw"
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = etfs.filter((etf) => {
    const q = search.toLowerCase();
    const matchSearch =
      etf.ticker.toLowerCase().includes(q) ||
      etf.naam.toLowerCase().includes(q);
    const matchCategory =
      activeCategory === "Alle" || etf.categorie === activeCategory;
    return matchSearch && matchCategory;
  });

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
    <div className="space-y-8 pb-24">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">ETF&apos;s verkennen</h1>
        <p className="text-gray-500">
          Ontdek fondsen die mogelijk bij jouw situatie passen. Geen aanbeveling — gebruik dit als
          startpunt voor je eigen onderzoek.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
        <p><strong>⚠️ Educatief platform — geen financieel advies</strong></p>
        <p>
          De informatie op deze pagina is uitsluitend bedoeld ter educatie en vergelijking.
          BeleggenCoach is geen vergunde beleggingsadviseur (MiFID II) en geeft geen persoonlijk
          beleggingsadvies. ETF-scores zijn indicatief en gebaseerd op publieke data.
          Raadpleeg een erkend financieel adviseur (FSMA-vergund) voor persoonlijk advies.
        </p>
      </div>

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
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary-500 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-primary-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Laad- en foutstatussen */}
      {loading && <LoadingSpinner text="ETF's worden geladen..." />}

      {!loading && error && <ErrorMessage message={error} />}

      {/* Skeleton tijdens laden */}
      {loading && (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="card space-y-3 animate-pulse"
              aria-hidden="true"
            >
              <div className="flex gap-3">
                <div className="h-5 bg-gray-200 rounded w-16" />
                <div className="h-5 bg-gray-100 rounded w-24" />
              </div>
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-2 bg-gray-100 rounded-full w-full" />
              <div className="flex justify-between">
                <div className="h-4 bg-gray-100 rounded w-24" />
                <div className="h-6 bg-gray-100 rounded-full w-28" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kaarten */}
      {!loading && !error && (
        <>
          {filtered.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {filtered.map((etf) => (
                <ETFCard
                  key={etf.isin}
                  {...toETFCardProps(etf)}
                  onCompare={handleCompare}
                  compareSelected={compareList.includes(etf.ticker)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">Geen ETF&apos;s gevonden</p>
              <p className="text-sm mt-1">Probeer een andere zoekterm of categorie.</p>
            </div>
          )}
        </>
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
    </div>
  );
}


