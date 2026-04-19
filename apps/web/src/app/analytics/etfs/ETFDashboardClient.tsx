"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
} from "recharts";
import { api, type ETFMetric, type KoersDataPunt } from "@/lib/api";

// ─── Mock fallback data ────────────────────────────────────────────────────────

const MOCK_METRICS: ETFMetric[] = [
  {
    ticker: "VWCE",
    naam: "Vanguard FTSE All-World",
    ter: 0.22,
    return_1m: 1.2,
    return_3m: 3.4,
    return_ytd: 8.1,
    return_1y: 18.2,
    return_3y: 38.5,
    return_5y: 89.3,
    volatility_1y: 14.2,
    sharpe_1y: 1.18,
    max_drawdown: -34.1,
    last_price: 117.5,
  },
  {
    ticker: "IWDA",
    naam: "iShares Core MSCI World",
    ter: 0.2,
    return_1m: 1.1,
    return_3m: 3.1,
    return_ytd: 7.8,
    return_1y: 17.5,
    return_3y: 36.2,
    return_5y: 85.1,
    volatility_1y: 13.8,
    sharpe_1y: 1.15,
    max_drawdown: -33.8,
    last_price: 94.2,
  },
  {
    ticker: "SXR8",
    naam: "iShares Core S&P 500",
    ter: 0.07,
    return_1m: 1.8,
    return_3m: 4.2,
    return_ytd: 9.5,
    return_1y: 21.3,
    return_3y: 45.1,
    return_5y: 105.2,
    volatility_1y: 15.1,
    sharpe_1y: 1.32,
    max_drawdown: -33.9,
    last_price: 541.8,
  },
  {
    ticker: "EMIM",
    naam: "iShares Core MSCI EM IMI",
    ter: 0.18,
    return_1m: -0.4,
    return_3m: 1.2,
    return_ytd: 4.3,
    return_1y: 9.8,
    return_3y: 12.4,
    return_5y: 28.7,
    volatility_1y: 18.3,
    sharpe_1y: 0.48,
    max_drawdown: -32.7,
    last_price: 33.4,
  },
  {
    ticker: "AGGH",
    naam: "iShares Global Aggregate Bond",
    ter: 0.1,
    return_1m: 0.3,
    return_3m: 0.8,
    return_ytd: 1.2,
    return_1y: 3.4,
    return_3y: -8.2,
    return_5y: 2.1,
    volatility_1y: 6.2,
    sharpe_1y: 0.22,
    max_drawdown: -21.4,
    last_price: 51.2,
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type SortableKey =
  | "return_1m"
  | "return_3m"
  | "return_ytd"
  | "return_1y"
  | "return_3y"
  | "return_5y"
  | "volatility_1y"
  | "sharpe_1y";

type Period = "1y" | "3y" | "5y";

interface ScatterPoint {
  x: number;
  y: number;
  ticker: string;
}

interface ChartPoint {
  datum: string;
  etf: number;
  benchmark: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPct(val: number | null | undefined): string {
  if (val == null) return "–";
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}%`;
}

function returnCellClass(val: number | null | undefined): string {
  if (val == null) return "text-gray-400";
  if (val > 5) return "bg-green-200 text-green-900 font-semibold";
  if (val > 2) return "bg-green-100 text-green-800";
  if (val >= 0) return "text-gray-700";
  if (val >= -2) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800 font-semibold";
}

/** Deterministic pseudo-random history generator (seeded on ticker). */
function generateMockHistory(ticker: string, days: number): KoersDataPunt[] {
  const basePrice =
    MOCK_METRICS.find((m) => m.ticker === ticker)?.last_price ?? 100;
  const seed = ticker
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  let rng = seed;
  const rand = () => {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    return (rng >>> 0) / 0x100000000;
  };

  let price = basePrice * (1 - (days / 365) * 0.14);
  const step = days > 365 ? 7 : 1;
  const data: KoersDataPunt[] = [];
  const now = new Date();

  for (let i = days; i >= 0; i -= step) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    price = Math.max(1, price * (1 + (rand() - 0.468) * 0.016));
    data.push({
      datum: d.toISOString().slice(0, 10),
      koers: Math.round(price * 100) / 100,
    });
  }
  return data;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className ?? ""}`} />
  );
}

interface ScatterDotProps {
  cx?: number;
  cy?: number;
  payload?: ScatterPoint;
}

function ScatterDot({ cx = 0, cy = 0, payload }: ScatterDotProps) {
  if (!payload) return null;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#6366f1"
        fillOpacity={0.85}
        stroke="#fff"
        strokeWidth={1.5}
      />
      <text
        x={cx + 9}
        y={cy + 4}
        fontSize={10}
        fill="#374151"
        fontWeight="600"
      >
        {payload.ticker}
      </text>
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ETFDashboardClient() {
  const [metrics, setMetrics] = useState<ETFMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  const [sortKey, setSortKey] = useState<SortableKey>("return_1y");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [selectedTicker, setSelectedTicker] = useState("SXR8");
  const [period, setPeriod] = useState<Period>("1y");
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Load metrics on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await api.analytics.getETFMetrics();
        if (data.length > 0) {
          setMetrics(data);
        } else {
          setMetrics(MOCK_METRICS);
          setUsingMock(true);
        }
      } catch {
        setMetrics(MOCK_METRICS);
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Pick first non-VWCE ticker as default once metrics load
  useEffect(() => {
    if (metrics.length > 0) {
      const first = metrics.find((m) => m.ticker !== "VWCE");
      if (first) setSelectedTicker(first.ticker);
    }
  }, [metrics]);

  // Load benchmark chart data
  const loadChart = useCallback(async () => {
    if (!selectedTicker || metrics.length === 0) return;
    setChartLoading(true);
    const periodDays = period === "1y" ? 365 : period === "3y" ? 1095 : 1825;

    try {
      const [etfHistory, benchHistory] = await Promise.all([
        api.analytics.getETFHistory(selectedTicker, period),
        api.analytics.getETFHistory("VWCE", period),
      ]);
      const benchMap = new Map<string, number>(benchHistory.map((p) => [p.datum, p.koers]));
      setChartData(
        etfHistory
          .filter((p) => benchMap.has(p.datum))
          .map((p) => ({
            datum: p.datum,
            etf: p.koers,
            benchmark: benchMap.get(p.datum)!,
          }))
      );
    } catch {
      const etfHist = generateMockHistory(selectedTicker, periodDays);
      const benchHist = generateMockHistory("VWCE", periodDays);
      const benchMap = new Map<string, number>(benchHist.map((p) => [p.datum, p.koers]));
      setChartData(
        etfHist
          .filter((p) => benchMap.has(p.datum))
          .map((p) => ({
            datum: p.datum,
            etf: p.koers,
            benchmark: benchMap.get(p.datum)!,
          }))
      );
    } finally {
      setChartLoading(false);
    }
  }, [selectedTicker, period, metrics.length]);

  useEffect(() => {
    loadChart();
  }, [loadChart]);

  // ── Derived data (memoized) ──────────────────────────────────────────────────

  const sortedMetrics = useMemo(
    () =>
      [...metrics].sort((a, b) => {
        const av =
          a[sortKey] ?? (sortDir === "desc" ? -Infinity : Infinity);
        const bv =
          b[sortKey] ?? (sortDir === "desc" ? -Infinity : Infinity);
        return sortDir === "desc" ? bv - av : av - bv;
      }),
    [metrics, sortKey, sortDir]
  );

  const bestPerformer = useMemo(
    () =>
      [...metrics].sort(
        (a, b) => (b.return_1y ?? -Infinity) - (a.return_1y ?? -Infinity)
      )[0],
    [metrics]
  );

  const lowestCost = useMemo(
    () =>
      [...metrics]
        .filter((m) => m.ter != null)
        .sort((a, b) => (a.ter ?? Infinity) - (b.ter ?? Infinity))[0] ??
      metrics[0],
    [metrics]
  );

  const mostStable = useMemo(
    () =>
      [...metrics]
        .filter((m) => m.volatility_1y != null)
        .sort(
          (a, b) =>
            (a.volatility_1y ?? Infinity) - (b.volatility_1y ?? Infinity)
        )[0],
    [metrics]
  );

  const vwce = useMemo(
    () => metrics.find((m) => m.ticker === "VWCE"),
    [metrics]
  );

  const top5 = useMemo(
    () =>
      [...metrics]
        .filter((m) => m.return_1y != null)
        .sort(
          (a, b) => (b.return_1y ?? -Infinity) - (a.return_1y ?? -Infinity)
        )
        .slice(0, 5),
    [metrics]
  );

  const comparableTickers = useMemo(
    () => metrics.filter((m) => m.ticker !== "VWCE"),
    [metrics]
  );

  const scatterData = useMemo<ScatterPoint[]>(
    () =>
      metrics
        .filter((m) => m.volatility_1y != null && m.return_1y != null)
        .map((m) => ({
          x: m.volatility_1y!,
          y: m.return_1y!,
          ticker: m.ticker,
        })),
    [metrics]
  );

  const avgVolatility = useMemo(
    () =>
      scatterData.length > 0
        ? scatterData.reduce((s, d) => s + d.x, 0) / scatterData.length
        : 0,
    [scatterData]
  );

  const avgReturn = useMemo(
    () =>
      scatterData.length > 0
        ? scatterData.reduce((s, d) => s + d.y, 0) / scatterData.length
        : 0,
    [scatterData]
  );

  /** Chart data indexed to 100 at start for fair comparison. */
  const normalizedChartData = useMemo(() => {
    if (chartData.length === 0) return [];
    const firstEtf = chartData[0].etf;
    const firstBench = chartData[0].benchmark;
    if (!firstEtf || !firstBench) return [];
    return chartData.map((p) => ({
      datum: p.datum,
      [selectedTicker]: Math.round((p.etf / firstEtf) * 10000) / 100,
      VWCE: Math.round((p.benchmark / firstBench) * 10000) / 100,
    }));
  }, [chartData, selectedTicker]);

  const handleSort = (key: SortableKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const HEATMAP_COLS: { key: SortableKey; label: string }[] = [
    { key: "return_1m", label: "1M" },
    { key: "return_3m", label: "3M" },
    { key: "return_ytd", label: "YTD" },
    { key: "return_1y", label: "1J" },
    { key: "return_3y", label: "3J" },
    { key: "return_5y", label: "5J" },
    { key: "volatility_1y", label: "Volatiliteit" },
    { key: "sharpe_1y", label: "Sharpe" },
  ];

  // ── Loading skeleton ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
        <div className="card p-4 space-y-3">
          <Skeleton className="h-6 w-48 mb-2" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // ── Full dashboard ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          📊 ETF Performance Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Actuele prestaties, risico en onderlinge vergelijking van populaire
          ETF&apos;s.
        </p>
        {usingMock && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-700">
            ⚠️ Backend niet bereikbaar — voorbeelddata wordt getoond
          </div>
        )}
      </div>

      {/* ── 1. KPI Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Beste performer */}
        <div className="card p-4 border-l-4 border-green-500">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            🏆 Beste performer 1J
          </p>
          <p className="text-base font-bold text-gray-900">
            {bestPerformer?.ticker ?? "–"}
          </p>
          <p className="text-xs text-gray-500 truncate mb-2">
            {bestPerformer?.naam ?? ""}
          </p>
          <p className="text-2xl font-bold text-green-600">
            {fmtPct(bestPerformer?.return_1y)}
          </p>
        </div>

        {/* Laagste kosten */}
        <div className="card p-4 border-l-4 border-blue-500">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            💰 Laagste kosten
          </p>
          <p className="text-base font-bold text-gray-900">
            {lowestCost?.ticker ?? "–"}
          </p>
          <p className="text-xs text-gray-500 truncate mb-2">
            {lowestCost?.naam ?? ""}
          </p>
          {lowestCost?.ter != null ? (
            <p className="text-2xl font-bold text-blue-600">
              {lowestCost.ter.toFixed(2)}%{" "}
              <span className="text-sm font-normal">TER</span>
            </p>
          ) : (
            <p className="text-gray-400 text-sm">–</p>
          )}
        </div>

        {/* Meest stabiel */}
        <div className="card p-4 border-l-4 border-purple-500">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            🛡️ Meest stabiel
          </p>
          <p className="text-base font-bold text-gray-900">
            {mostStable?.ticker ?? "–"}
          </p>
          <p className="text-xs text-gray-500 truncate mb-2">
            {mostStable?.naam ?? ""}
          </p>
          <p className="text-2xl font-bold text-purple-600">
            {mostStable?.volatility_1y != null
              ? `${mostStable.volatility_1y.toFixed(1)}%`
              : "–"}{" "}
            <span className="text-sm font-normal">vol.</span>
          </p>
        </div>

        {/* Populairste */}
        <div className="card p-4 border-l-4 border-indigo-500">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            ⭐ Populairste
          </p>
          <p className="text-base font-bold text-gray-900">
            {vwce?.ticker ?? "VWCE"}
          </p>
          <p className="text-xs text-gray-500 truncate mb-2">
            {vwce?.naam ?? "Vanguard FTSE All-World"}
          </p>
          <p className="text-sm font-semibold text-indigo-600">
            Meest gebruikt door beginners
          </p>
        </div>
      </div>

      {/* ── 2. Performance Heatmap ─────────────────────────────────────────────── */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Performance heatmap
          </h2>
          <p className="text-sm text-gray-500">
            Klik op een kolomkop om te sorteren.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600 whitespace-nowrap sticky left-0 bg-gray-50 z-10">
                  ETF
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 whitespace-nowrap min-w-[160px]">
                  Naam
                </th>
                {HEATMAP_COLS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 font-medium text-gray-600 whitespace-nowrap cursor-pointer hover:text-primary-600 select-none text-right"
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="ml-1 text-primary-500">
                        {sortDir === "desc" ? "↓" : "↑"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedMetrics.map((m, i) => {
                const returnCols: (number | null)[] = [
                  m.return_1m,
                  m.return_3m,
                  m.return_ytd,
                  m.return_1y,
                  m.return_3y,
                  m.return_5y,
                ];
                return (
                  <tr
                    key={m.ticker}
                    className={`border-t border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                  >
                    <td className="px-4 py-3 sticky left-0 bg-inherit z-10">
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-mono font-bold">
                        {m.ticker}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-[180px] truncate">
                      {m.naam}
                    </td>
                    {returnCols.map((val, j) => (
                      <td
                        key={j}
                        className={`px-3 py-3 text-xs text-right ${returnCellClass(val)}`}
                      >
                        {fmtPct(val)}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-xs text-right text-gray-700">
                      {m.volatility_1y != null
                        ? `${m.volatility_1y.toFixed(1)}%`
                        : "–"}
                    </td>
                    <td className="px-3 py-3 text-xs text-right font-medium text-gray-700">
                      {m.sharpe_1y != null ? m.sharpe_1y.toFixed(2) : "–"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3. Benchmark vergelijking ──────────────────────────────────────────── */}
      <div className="card p-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Benchmark vergelijking
          </h2>
          <p className="text-sm text-gray-500">
            Vergelijk een ETF met VWCE als benchmark (geïndexeerd op 100).
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              ETF kiezen
            </label>
            <select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              {comparableTickers.map((m) => (
                <option key={m.ticker} value={m.ticker}>
                  {m.ticker} — {m.naam}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Periode</label>
            <div className="flex gap-1">
              {(["1y", "3y", "5y"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    period === p
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary-300"
                  }`}
                >
                  {p === "1y" ? "1J" : p === "3y" ? "3J" : "5J"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {chartLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={normalizedChartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="datum"
                tick={{ fontSize: 10 }}
                tickFormatter={(d: string) => d.slice(0, 7)}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v: number) => `${v}`}
                domain={["auto", "auto"]}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}`,
                  name,
                ]}
                labelFormatter={(label: string) => `Datum: ${label}`}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey={selectedTicker}
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                name={selectedTicker}
              />
              <Line
                type="monotone"
                dataKey="VWCE"
                stroke="#94a3b8"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 4"
                name="VWCE (benchmark)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        <p className="text-xs text-gray-400">
          Geïndexeerd: startwaarde = 100. Een hogere lijn = betere relatieve
          prestatie over de gekozen periode.
        </p>
      </div>

      {/* ── 4. Top 5 performers ────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          🥇 Top 5 performers (1J rendement)
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {top5.map((m, i) => (
            <div key={m.ticker} className="card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-300">
                  #{i + 1}
                </span>
                <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-mono font-bold">
                  {m.ticker}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-snug">{m.naam}</p>
              <span
                className={`inline-block px-2 py-1 rounded-full text-sm font-bold ${
                  (m.return_1y ?? 0) >= 0
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {fmtPct(m.return_1y)}
              </span>
              <div className="text-xs text-gray-400 space-y-0.5 pt-1 border-t border-gray-100">
                <div>
                  Volatiliteit:{" "}
                  {m.volatility_1y != null
                    ? `${m.volatility_1y.toFixed(1)}%`
                    : "–"}
                </div>
                <div>
                  Sharpe:{" "}
                  {m.sharpe_1y != null ? m.sharpe_1y.toFixed(2) : "–"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. Risico-rendement scatter ────────────────────────────────────────── */}
      <div className="card p-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Risico-rendement grafiek
          </h2>
          <p className="text-sm text-gray-500">
            X-as: volatiliteit (risico) · Y-as: 1J rendement. Stippellijnen
            tonen de gemiddelden.
          </p>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart margin={{ top: 20, right: 40, bottom: 40, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="x"
              name="Volatiliteit"
              type="number"
              domain={["auto", "auto"]}
              tick={{ fontSize: 11 }}
              label={{
                value: "Volatiliteit (%)",
                position: "insideBottom",
                offset: -20,
                fontSize: 11,
                fill: "#6b7280",
              }}
            />
            <YAxis
              dataKey="y"
              name="Rendement 1J"
              type="number"
              domain={["auto", "auto"]}
              tick={{ fontSize: 11 }}
              label={{
                value: "Rendement 1J (%)",
                angle: -90,
                position: "insideLeft",
                offset: 10,
                fontSize: 11,
                fill: "#6b7280",
              }}
            />
            <ZAxis range={[90, 90]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload as ScatterPoint;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm text-xs">
                    <p className="font-bold text-gray-900 mb-1">{d.ticker}</p>
                    <p className="text-gray-500">
                      Volatiliteit: {d.x.toFixed(1)}%
                    </p>
                    <p className="text-gray-500">
                      Rendement: {fmtPct(d.y)}
                    </p>
                  </div>
                );
              }}
            />
            <ReferenceLine
              x={avgVolatility}
              stroke="#d1d5db"
              strokeDasharray="4 4"
              label={{
                value: "gem. risico",
                position: "top",
                fontSize: 10,
                fill: "#9ca3af",
              }}
            />
            <ReferenceLine
              y={avgReturn}
              stroke="#d1d5db"
              strokeDasharray="4 4"
              label={{
                value: "gem. rendement",
                position: "right",
                fontSize: 10,
                fill: "#9ca3af",
              }}
            />
            <Scatter
              data={scatterData}
              shape={(props: unknown) => (
                <ScatterDot {...(props as ScatterDotProps)} />
              )}
            />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-6 text-xs text-gray-400">
          <span>↙ Laag risico, lager rendement</span>
          <span>↗ Hoog risico, hoog rendement</span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 space-y-1">
        <p className="font-semibold">⚠️ Disclaimer</p>
        <p>
          Dit dashboard toont historische prestaties uitsluitend ter educatieve
          vergelijking. Rendementen uit het verleden bieden geen garantie voor
          de toekomst. Dit is geen beleggingsadvies.{" "}
          <a href="/disclaimer" className="underline hover:text-amber-900">
            Lees onze volledige disclaimer.
          </a>
        </p>
      </div>
    </div>
  );
}
