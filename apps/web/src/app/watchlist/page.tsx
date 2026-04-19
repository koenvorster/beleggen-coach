"use client";

import { useEffect, useState } from "react";
import { Heart, Trash2, PlusCircle, Search, RefreshCw } from "lucide-react";
import Link from "next/link";
import { api, type BackendETF } from "@/lib/api";
import { MOCK_ETFS, type MockETF } from "@/lib/mock-etfs";
import { useWatchlist } from "@/lib/use-watchlist";

function mockToBackendETF(mock: MockETF): BackendETF {
  return {
    isin: mock.isin,
    ticker: mock.ticker,
    naam: mock.name,
    categorie: mock.category,
    regio: "Wereld",
    expense_ratio: mock.ter,
    aum_miljard_eur: 0,
    accumulating: mock.accumulating,
    volatility_3y: 0,
    beginner_score: mock.beginnerScore,
    description: mock.description,
  };
}

export default function WatchlistPage() {
  const { watchlist, remove, toggle, isInWatchlist, mounted } = useWatchlist();
  const [allEtfs, setAllEtfs] = useState<BackendETF[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.etfs
      .list()
      .then(setAllEtfs)
      .catch(() => setAllEtfs(MOCK_ETFS.map(mockToBackendETF)))
      .finally(() => setLoading(false));
  }, []);

  const watchlistEtfs = allEtfs.filter((e) => isInWatchlist(e.isin));

  const searchResults =
    search.length >= 2
      ? allEtfs.filter((e) => {
          const q = search.toLowerCase();
          return (
            e.ticker.toLowerCase().includes(q) ||
            e.naam.toLowerCase().includes(q) ||
            e.isin.toLowerCase().includes(q)
          );
        })
      : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mijn volglijst 💛</h1>
        <p className="text-gray-500 text-sm mt-1">
          Sla ETF&apos;s op die je interessant vindt voor later onderzoek.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        ⚠️ De volglijst is opgeslagen in je browser. ETF-informatie is indicatief — geen
        financieel advies.
      </div>

      {/* Zoekbalk */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Search className="w-4 h-4 text-primary-600" />
          ETF zoeken &amp; toevoegen
        </h2>
        <input
          type="text"
          placeholder="Zoek op naam, ticker of ISIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        {search.length >= 2 && (
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                ETF-data laden…
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-sm text-gray-400">Geen ETF&apos;s gevonden.</p>
            ) : (
              searchResults.map((etf) => (
                <div
                  key={etf.isin}
                  className="flex items-center justify-between gap-4 border border-gray-100 rounded-xl px-4 py-3 bg-gray-50"
                >
                  <div>
                    <span className="font-semibold text-gray-900">{etf.ticker}</span>
                    <span className="text-xs text-gray-500 ml-2">{etf.naam}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">
                      {etf.isin} · TER: {((etf.expense_ratio ?? 0) * 100).toFixed(2)}%/jaar
                    </span>
                  </div>
                  <button
                    onClick={() => toggle(etf.isin)}
                    className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors shrink-0 ${
                      isInWatchlist(etf.isin)
                        ? "bg-rose-500 text-white border-rose-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-rose-400 hover:text-rose-500"
                    }`}
                  >
                    <Heart
                      className="w-3 h-3"
                      fill={isInWatchlist(etf.isin) ? "currentColor" : "none"}
                    />
                    {isInWatchlist(etf.isin) ? "Gevolgd" : "Volgen"}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Gevolgde ETF's */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Gevolgde ETF&apos;s</h2>

        {!mounted || loading ? (
          <div className="card py-8 flex items-center justify-center gap-2 text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Laden…</span>
          </div>
        ) : watchlist.length === 0 ? (
          <div className="card text-center py-12 space-y-3">
            <div className="text-4xl">💛</div>
            <p className="text-gray-500">Je volglijst is leeg.</p>
            <p className="text-sm text-gray-400">
              Gebruik de zoekbalk hierboven of ga naar{" "}
              <Link href="/etfs" className="text-primary-600 hover:underline">
                ETF&apos;s verkennen
              </Link>{" "}
              om ETF&apos;s toe te voegen.
            </p>
          </div>
        ) : watchlistEtfs.length === 0 ? (
          <div className="card text-center py-8 text-sm text-gray-400 space-y-1">
            <p>ETF-data wordt geladen…</p>
            <p className="text-xs">
              {watchlist.length} ISIN{watchlist.length !== 1 ? "s" : ""} opgeslagen in je
              volglijst.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {watchlistEtfs.map((etf) => (
              <div
                key={etf.isin}
                className="card flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">{etf.ticker}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {etf.categorie}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        etf.accumulating
                          ? "bg-primary-50 text-primary-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {etf.accumulating ? "Accumulerend" : "Uitkerend"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{etf.naam}</p>
                  <p className="text-xs text-gray-400">
                    ISIN:{" "}
                    <span className="font-mono">{etf.isin}</span> · TER:{" "}
                    <span className="font-medium text-gray-600">
                      {((etf.expense_ratio ?? 0) * 100).toFixed(2)}%/jaar
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href="/portfolio"
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                  >
                    <PlusCircle className="w-3 h-3" />
                    Voeg toe aan portfolio
                  </Link>
                  <button
                    onClick={() => remove(etf.isin)}
                    title="Verwijder van volglijst"
                    className="text-gray-400 hover:text-red-500 transition-colors p-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
