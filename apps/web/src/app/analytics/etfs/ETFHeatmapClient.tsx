"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ETFMetrics {
  isin: string;
  date: string;
  return_1m: number | null;
  return_3m: number | null;
  return_ytd: number | null;
  return_1y: number | null;
  return_3y: number | null;
  return_5y: number | null;
  volatility_1y: number | null;
  sharpe_ratio_1y: number | null;
  max_drawdown_1y: number | null;
}

const ETF_CATALOG = [
  { isin: "IE00BK5BQT80", name: "VWCE" },
  { isin: "IE00B4L5Y983", name: "IEUR" },
  { isin: "IE00B1YZSC51", name: "IDEV" },
  { isin: "IE00BHXPXC80", name: "VMEE" },
  { isin: "IE00BYX2JD69", name: "VUSA" },
];

const PERIODS = [
  { key: "return_1m" as const, label: "1M" },
  { key: "return_3m" as const, label: "3M" },
  { key: "return_ytd" as const, label: "YTD" },
  { key: "return_1y" as const, label: "1Y" },
  { key: "return_3y" as const, label: "3Y" },
  { key: "return_5y" as const, label: "5Y" },
];

function getColor(value: number | null): string {
  if (value === null) return "bg-gray-100 text-gray-400";
  if (value > 20) return "bg-green-600 text-white";
  if (value > 10) return "bg-green-500 text-white";
  if (value > 0) return "bg-green-400 text-white";
  if (value > -5) return "bg-yellow-200 text-gray-900";
  if (value > -10) return "bg-orange-400 text-white";
  return "bg-red-600 text-white";
}

function getIcon(value: number | null) {
  if (value === null) return null;
  if (value > 0) return <TrendingUp className="w-3 h-3" />;
  if (value < 0) return <TrendingDown className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
}

export default function ETFHeatmapClient() {
  const [metrics, setMetrics] = useState<ETFMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/etf-metrics")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setMetrics(result.data);
        } else {
          setError(result.error?.message || "Failed to load metrics");
        }
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ETF Performance Heatmap</h1>
          <p className="text-gray-500 mt-2">Historische returns en risicometriek.</p>
        </div>
        <div className="card py-12 text-center text-gray-400">
          Metrics laden...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ETF Performance Heatmap</h1>
        </div>
        <div className="card p-6 text-center text-red-600">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📊 ETF Performance Heatmap</h1>
        <p className="text-gray-500 mt-2">
          Historische returns (groen = positief, rood = negatief) en risicometriek voor de top 5 ETF's.
        </p>
      </div>

      {/* Returns heatmap */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Returns per periode</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 font-semibold text-gray-700">ETF</th>
                {PERIODS.map((p) => (
                  <th key={p.key} className="text-center py-3 px-2 font-semibold text-gray-700">
                    {p.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ETF_CATALOG.map((etf) => {
                const m = metrics.find((m) => m.isin === etf.isin);
                return (
                  <tr key={etf.isin} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 font-semibold text-gray-900">{etf.name}</td>
                    {PERIODS.map((p) => {
                      const value = m ? m[p.key] : null;
                      return (
                        <td key={p.key} className="text-center py-3 px-2">
                          <div
                            className={`inline-flex items-center justify-center gap-1 rounded px-2 py-1 ${getColor(value)}`}
                          >
                            {getIcon(value)}
                            {value !== null ? `${value.toFixed(2)}%` : "—"}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk metrics */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Risicometriek (1-jaars)</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ETF_CATALOG.map((etf) => {
            const m = metrics.find((m) => m.isin === etf.isin);
            if (!m) return null;
            return (
              <div key={etf.isin} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <p className="font-semibold text-gray-900">{etf.name}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volatiliteit</span>
                    <span className="font-semibold text-gray-900">
                      {m.volatility_1y ? `${m.volatility_1y.toFixed(2)}%` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sharpe Ratio</span>
                    <span className="font-semibold text-gray-900">
                      {m.sharpe_ratio_1y ? `${m.sharpe_ratio_1y.toFixed(2)}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Drawdown</span>
                    <span className={`font-semibold ${m.max_drawdown_1y && m.max_drawdown_1y < -10 ? "text-red-600" : "text-gray-900"}`}>
                      {m.max_drawdown_1y ? `${m.max_drawdown_1y.toFixed(2)}%` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legende */}
      <div className="card p-4 bg-gray-50 space-y-3">
        <p className="font-semibold text-gray-900">📚 Uitleg</p>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Return</strong>: Procentueel rendement over periode. Groen = positief, rood = negatief.</p>
          <p><strong>Volatiliteit</strong>: Jaarlijkse standaarddeviatie (risico). Lager = rustiger.</p>
          <p><strong>Sharpe Ratio</strong>: Rendement per eenheid risico. Hoger = beter risico/opbrengst balance.</p>
          <p><strong>Max Drawdown</strong>: Ergste dip van top tot dal. Lager (meer negatief) = riskanter periode.</p>
        </div>
      </div>
    </div>
  );
}
