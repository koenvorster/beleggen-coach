"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, Info } from "lucide-react";
import { api, type BackendETF } from "@/lib/api";
import { MOCK_ETFS, type MockETF } from "@/lib/mock-etfs";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useWatchlist } from "@/lib/use-watchlist";

const ESG_SCORES: Record<string, { score: number; label: string }> = {
  "IE00B3RBWM25": { score: 8, label: "Hoge ESG-score" },   // VWRL
  "IE00B4L5Y983": { score: 7, label: "Goede ESG-score" },  // IWDA
  "IE00B3XXRP09": { score: 6, label: "Gemiddelde ESG-score" },
  "IE00B4WXJJ64": { score: 7, label: "Goede ESG-score" },
  "IE00B4L5YC18": { score: 5, label: "Beperkte ESG-score" },
};

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

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 85
      ? "bg-green-100 text-green-700"
      : score >= 70
      ? "bg-yellow-100 text-yellow-700"
      : "bg-gray-100 text-gray-500";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      ★ {score}
    </span>
  );
}

function ESGBadge({ isin }: { isin: string }) {
  const esg = ESG_SCORES[isin];
  if (!esg) {
    return <span className="text-xs text-gray-400 italic">Niet beschikbaar</span>;
  }
  const colorClass =
    esg.score >= 8
      ? "bg-green-100 text-green-700"
      : esg.score >= 7
      ? "bg-emerald-50 text-emerald-700"
      : esg.score >= 5
      ? "bg-yellow-50 text-yellow-700"
      : "bg-gray-100 text-gray-500";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
      🌱 {esg.score}/10 · {esg.label}
    </span>
  );
}

function CompareTable() {
  const params = useSearchParams();
  const tickers = [params.get("a"), params.get("b"), params.get("c")]
    .filter(Boolean) as string[];

  const [allEtfs, setAllEtfs] = useState<BackendETF[]>([]);
  const [usingMock, setUsingMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [esgFilter, setEsgFilter] = useState(false);
  const [showGreenwashingTip, setShowGreenwashingTip] = useState(false);
  const { toggle, isInWatchlist } = useWatchlist();

  useEffect(() => {
    let cancelled = false;
    api.etfs
      .list()
      .then((data) => {
        if (!cancelled) {
          setAllEtfs(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAllEtfs(MOCK_ETFS.map(mockToBackendETF));
          setUsingMock(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingSpinner text="ETF-data ophalen..." />;

  const allSelected = tickers
    .map((t) => allEtfs.find((e) => e.ticker === t))
    .filter(Boolean) as BackendETF[];

  const etfs = esgFilter
    ? allSelected.filter((e) => (ESG_SCORES[e.isin]?.score ?? 0) >= 7)
    : allSelected;

  if (allSelected.length < 2) {
    return (
      <div className="text-center py-16 text-gray-400 space-y-4">
        <p className="text-lg">Selecteer minstens 2 ETF&apos;s om te vergelijken.</p>
        <Link href="/etfs" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Terug naar ETF&apos;s
        </Link>
      </div>
    );
  }

  const rows: {
    label: string;
    render: (e: BackendETF) => React.ReactNode;
  }[] = [
    {
      label: "Naam",
      render: (e) => (
        <span className="font-semibold text-gray-900">
          {e.ticker}
          <span className="block text-xs font-normal text-gray-500">{e.naam}</span>
        </span>
      ),
    },
    {
      label: "ISIN",
      render: (e) => <span className="font-mono text-xs">{e.isin}</span>,
    },
    {
      label: "Categorie",
      render: (e) => <span>{e.categorie}</span>,
    },
    {
      label: "Regio",
      render: (e) => <span>{e.regio}</span>,
    },
    {
      label: "Kosten (TER)",
      render: (e) => (
        <span className="font-semibold text-primary-600">
          {((e.expense_ratio ?? 0) * 100).toFixed(2)}%/jaar
        </span>
      ),
    },
    {
      label: "AUM",
      render: (e) => (
        <span>{e.aum_miljard_eur != null ? `€${e.aum_miljard_eur.toFixed(1)} mrd` : "—"}</span>
      ),
    },
    {
      label: "Volatiliteit (3j)",
      render: (e) => (
        <span>{e.volatility_3y != null ? `${(e.volatility_3y * 100).toFixed(1)}%` : "—"}</span>
      ),
    },
    {
      label: "Type",
      render: (e) => (
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            e.accumulating
              ? "bg-primary-50 text-primary-700"
              : "bg-orange-50 text-orange-700"
          }`}
        >
          {e.accumulating ? "Accumulerend" : "Uitkerend"}
        </span>
      ),
    },
    {
      label: "Beginner-score",
      render: (e) => <ScoreBadge score={e.beginner_score} />,
    },
    {
      label: "ESG-score",
      render: (e) => <ESGBadge isin={e.isin} />,
    },
    {
      label: "Omschrijving",
      render: (e) => (
        <span className="text-xs text-gray-500">{e.description}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* ESG filter controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setEsgFilter(!esgFilter)}
          className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border transition-colors ${
            esgFilter
              ? "bg-green-500 text-white border-green-500"
              : "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600"
          }`}
        >
          🌱 Toon alleen ESG-vriendelijk (≥7)
        </button>
        <button
          onClick={() => setShowGreenwashingTip(!showGreenwashingTip)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          title="Meer over ESG en greenwashing"
        >
          <Info className="w-3.5 h-3.5" />
          Wat is ESG?
        </button>
      </div>

      {/* Greenwashing waarschuwing */}
      {showGreenwashingTip && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 space-y-2">
          <p className="font-semibold">⚠️ ESG en greenwashing — wat je moet weten</p>
          <p>
            ESG-scores meten milieu (Environment), maatschappij (Social) en bestuur (Governance).
            Een hoge score betekent niet automatisch dat een ETF &quot;groen&quot; is —{" "}
            <strong>greenwashing</strong> komt voor: producten worden als duurzaam gepresenteerd
            zonder duidelijke onderbouwing.
          </p>
          <p className="text-xs text-amber-700">
            Controleer altijd de SFDR-classificatie (Artikel 8 of Artikel 9) via de officiële
            factsheet van de aanbieder. De ESG-scores op deze pagina zijn indicatief en geen
            certificering.
          </p>
        </div>
      )}

      {usingMock && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          ⚠️ Tijdelijk worden voorbeelddata getoond — backend niet bereikbaar
        </div>
      )}

      {esgFilter && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
          🌱 ESG-filter actief: {etfs.length} van {allSelected.length} geselecteerde ETF&apos;s
          voldoen aan ESG-score ≥ 7.
          {etfs.length === 0 && (
            <button
              onClick={() => setEsgFilter(false)}
              className="ml-3 underline font-medium hover:text-green-900"
            >
              Filter uitschakelen
            </button>
          )}
        </div>
      )}

      {etfs.length < 2 && esgFilter ? (
        <div className="text-center py-12 text-gray-400 space-y-2">
          <p className="text-lg">Geen of te weinig ESG-vriendelijke ETF&apos;s geselecteerd.</p>
          <p className="text-sm">Deactiveer het ESG-filter of selecteer andere ETF&apos;s.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="text-left text-xs text-gray-400 font-medium py-3 pr-4 w-36">
                  Kenmerk
                </th>
                {etfs.map((e) => (
                  <th
                    key={e.ticker}
                    className="text-left font-bold text-primary-600 py-3 px-4 bg-primary-50 rounded-t-xl first:rounded-tl-xl last:rounded-tr-xl"
                  >
                    <div className="space-y-1.5">
                      <div>{e.ticker}</div>
                      <button
                        onClick={() => toggle(e.isin)}
                        title={
                          isInWatchlist(e.isin)
                            ? "Verwijder van volglijst"
                            : "Voeg toe aan volglijst"
                        }
                        className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition-colors ${
                          isInWatchlist(e.isin)
                            ? "bg-rose-500 text-white border-rose-500"
                            : "bg-white text-gray-500 border-gray-200 hover:border-rose-400 hover:text-rose-500"
                        }`}
                      >
                        <Heart
                          className="w-3 h-3"
                          fill={isInWatchlist(e.isin) ? "currentColor" : "none"}
                        />
                        {isInWatchlist(e.isin) ? "Gevolgd" : "♡ Volglijst"}
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="py-3 pr-4 text-xs text-gray-500 font-medium align-top">
                    {row.label}
                  </td>
                  {etfs.map((e) => (
                    <td key={e.ticker} className="py-3 px-4 align-top">
                      {row.render(e)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/etfs"
          className="text-gray-400 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ETF&apos;s vergelijken</h1>
          <p className="text-gray-500 text-sm mt-1">
            Vergelijk de kenmerken van geselecteerde ETF&apos;s naast elkaar.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Let op:</strong> Dit is geen financieel advies. Gebruik dit als startpunt voor
        je eigen onderzoek.
      </div>

      <div className="card">
        <Suspense fallback={<LoadingSpinner text="Vergelijkingstabel laden..." />}>
          <CompareTable />
        </Suspense>
      </div>

      <div className="text-center">
        <Link href="/etfs" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Selecteer andere ETF&apos;s
        </Link>
      </div>
    </div>
  );
}

