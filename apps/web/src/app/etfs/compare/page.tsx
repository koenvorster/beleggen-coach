"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api, type BackendETF } from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

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

function CompareTable() {
  const params = useSearchParams();
  const tickers = [params.get("a"), params.get("b"), params.get("c")]
    .filter(Boolean) as string[];

  const [allEtfs, setAllEtfs] = useState<BackendETF[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <LoadingSpinner text="ETF-data ophalen..." />;
  if (error) return <ErrorMessage message={error} />;

  const etfs = tickers
    .map((t) => allEtfs.find((e) => e.ticker === t))
    .filter(Boolean) as BackendETF[];

  if (etfs.length < 2) {
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
          {(e.expense_ratio * 100).toFixed(2)}%/jaar
        </span>
      ),
    },
    {
      label: "AUM",
      render: (e) => (
        <span>€{e.aum_miljard_eur.toFixed(1)} mrd</span>
      ),
    },
    {
      label: "Volatiliteit (3j)",
      render: (e) => (
        <span>{(e.volatility_3y * 100).toFixed(1)}%</span>
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
      label: "Omschrijving",
      render: (e) => (
        <span className="text-xs text-gray-500">{e.description}</span>
      ),
    },
  ];

  return (
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
                {e.ticker}
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

