"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Zap } from "lucide-react";

const ETF_CATALOG = [
  { isin: "IE00BK5BQT80", name: "VWCE", description: "Wereldwijd diversifieerd" },
  { isin: "IE00B4L5Y983", name: "IEUR", description: "Europese aandelen" },
  { isin: "IE00B1YZSC51", name: "IDEV", description: "Opkomende markten" },
  { isin: "IE00BHXPXC80", name: "VMEE", description: "Emerging markets" },
  { isin: "IE00BYX2JD69", name: "VUSA", description: "USA aandelen" },
];

interface BacktestResult {
  cagr: number;
  sharpe: number;
  max_drawdown: number;
  start_value: number;
  end_value: number;
  total_return: number;
  timeline: Array<{ date: string; value: number }>;
}

export default function BacktesterPage() {
  const [allocation, setAllocation] = useState<Record<string, number>>({
    "IE00BK5BQT80": 0.4,
    "IE00B4L5Y983": 0.3,
    "IE00BHXPXC80": 0.3,
  });

  const [startDate, setStartDate] = useState("2020-01-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [dcaMonthly, setDcaMonthly] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAllocationChange = (isin: string, value: number) => {
    const newAllocation = { ...allocation, [isin]: value / 100 };
    setAllocation(newAllocation);
  };

  const runBacktest = async () => {
    setIsSimulating(true);
    setError(null);

    try {
      const totalWeight = Object.values(allocation).reduce((a, b) => a + b, 0);
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        setError(`Allocatie moet tot 100% optellen (nu: ${Math.round(totalWeight * 100)}%)`);
        setIsSimulating(false);
        return;
      }

      const response = await fetch("/api/backtester", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocation,
          start_date: startDate,
          end_date: endDate,
          dca_monthly: dcaMonthly,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.error?.message || "Backtester fout");
        return;
      }

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error?.message || "Onbekende fout");
      }
    } catch (err) {
      setError((err as Error).message || "API fout");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Portfolio Backtester</h1>
        <p className="text-gray-500 mt-2">
          Test je allocatie tegen historische data (2004-heden). Bekijk CAGR, Sharpe ratio, en maximum drawdown.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Allocatie panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Allocation sliders */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Allocatie (in %)</h2>
            {ETF_CATALOG.map(({ isin, name, description }) => {
              const value = Math.round((allocation[isin] || 0) * 100);
              return (
                <div key={isin} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <label className="font-medium text-gray-700">{name}</label>
                    <span className="text-primary-600 font-semibold">{value}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={value}
                    onChange={(e) => handleAllocationChange(isin, parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <p className="text-xs text-gray-400">{description}</p>
                </div>
              );
            })}

            {/* Allocatie totaal */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-gray-700">Totaal</span>
                <span className={`font-semibold ${Math.abs(Object.values(allocation).reduce((a, b) => a + b, 0) - 1.0) > 0.01 ? "text-red-600" : "text-green-600"}`}>
                  {Math.round(Object.values(allocation).reduce((a, b) => a + b, 0) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Datum instellingen */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Periode & Investering</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Van datum</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tot datum</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Maandelijkse inleg (€)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={dcaMonthly || ""}
                  onChange={(e) => setDcaMonthly(e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Laat leeg voor eenmalig"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                />
                <button
                  onClick={() => setDcaMonthly(null)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 font-medium transition-colors"
                >
                  Reset
                </button>
              </div>
              <p className="text-xs text-gray-400">
                {dcaMonthly ? `€${dcaMonthly}/maand (DCA)` : "Eenmalig aan het begin"}
              </p>
            </div>
          </div>

          {/* Run button */}
          <button
            onClick={runBacktest}
            disabled={isSimulating}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            <Zap className="w-4 h-4" />
            {isSimulating ? "Simuleren..." : "Backtest starten"}
          </button>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        </div>

        {/* Resultaten panel */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              {/* Metrics grid */}
              <div className="grid sm:grid-cols-4 gap-4">
                <div className="card">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">CAGR</p>
                  <p className="text-2xl font-bold text-primary-600">{result.cagr.toFixed(2)}%</p>
                  <p className="text-xs text-gray-500">Jaarlijks rendement</p>
                </div>
                <div className="card">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Sharpe</p>
                  <p className="text-2xl font-bold text-primary-600">{result.sharpe.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Rendement/risico</p>
                </div>
                <div className="card">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Max Drawdown</p>
                  <p className="text-2xl font-bold text-red-600">{result.max_drawdown.toFixed(2)}%</p>
                  <p className="text-xs text-gray-500">Ergste dip</p>
                </div>
                <div className="card">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Total Return</p>
                  <p className="text-2xl font-bold text-green-600">{result.total_return.toFixed(2)}%</p>
                  <p className="text-xs text-gray-500">Startwaarde → eindwaarde</p>
                </div>
              </div>

              {/* Value boxes */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="card">
                  <p className="text-sm text-gray-400">Startkapitaal</p>
                  <p className="text-xl font-bold text-gray-900">€{result.start_value.toFixed(2)}</p>
                </div>
                <div className="card">
                  <p className="text-sm text-gray-400">Eindwaarde</p>
                  <p className="text-xl font-bold text-green-600">€{result.end_value.toFixed(2)}</p>
                </div>
              </div>

              {/* Chart */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Portfoliowaarde in tijd</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={result.timeline}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: "12px" }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      formatter={(value) => `€${(value as number).toFixed(2)}`}
                      labelFormatter={(label) => `Datum: ${label}`}
                    />
                    <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="card text-center py-16 text-gray-500">
              <p className="mb-4">📊 Voer allocatie, periode en instellingen in, dan klik "Backtest starten"</p>
              <p className="text-sm">Je ziet CAGR, Sharpe ratio, max drawdown en een timeline chart.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
