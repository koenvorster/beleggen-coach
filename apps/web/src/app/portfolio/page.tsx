"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, PlusCircle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MOCK_ETFS } from "@/lib/mock-etfs";

interface Position {
  id: string;
  ticker: string;
  etfName: string;
  units: number;
  avgBuyPrice: number;
  buyDate: string;
}

const CURRENT_PRICES: Record<string, number> = {
  IWDA: 89.42,
  VWCE: 115.30,
  VWRL: 112.80,
  SXR8: 544.20,
  EMIM: 32.15,
  IMEU: 28.90,
  AGGH: 4.82,
  EUN5: 161.30,
  VAGF: 52.10,
  XDWD: 87.65,
};

const PIE_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#6366f1",
];

const STORAGE_KEY = "beleggen_portfolio";

function fmt(n: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtPct(n: number) {
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [mounted, setMounted] = useState(false);

  // Form state
  const [ticker, setTicker] = useState(MOCK_ETFS[0].ticker);
  const [units, setUnits] = useState<string>("");
  const [avgBuyPrice, setAvgBuyPrice] = useState<string>("");
  const [buyDate, setBuyDate] = useState<string>(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPositions(JSON.parse(raw) as Position[]);
    } catch {
      // ignore parse errors
    }
  }, []);

  function save(updated: Position[]) {
    setPositions(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function handleAdd() {
    const u = parseFloat(units);
    const p = parseFloat(avgBuyPrice);
    if (!ticker || isNaN(u) || u <= 0 || isNaN(p) || p <= 0) return;
    const etf = MOCK_ETFS.find((e) => e.ticker === ticker);
    const newPos: Position = {
      id: Date.now().toString(),
      ticker,
      etfName: etf?.name ?? ticker,
      units: u,
      avgBuyPrice: p,
      buyDate,
    };
    save([...positions, newPos]);
    setUnits("");
    setAvgBuyPrice("");
  }

  function handleRemove(id: string) {
    save(positions.filter((p) => p.id !== id));
  }

  // When ticker changes, prefill buy price with current price
  function handleTickerChange(t: string) {
    setTicker(t);
    const price = CURRENT_PRICES[t];
    if (price) setAvgBuyPrice(price.toString());
  }

  // Calculations
  const totalInvested = positions.reduce((sum, p) => sum + p.units * p.avgBuyPrice, 0);
  const totalCurrent = positions.reduce(
    (sum, p) => sum + p.units * (CURRENT_PRICES[p.ticker] ?? p.avgBuyPrice),
    0,
  );
  const totalPnl = totalCurrent - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  const pieData = positions.map((p) => ({
    name: p.ticker,
    value: p.units * (CURRENT_PRICES[p.ticker] ?? p.avgBuyPrice),
  }));

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mijn portefeuille 💼</h1>
        <p className="text-gray-500 text-sm mt-1">
          Volg je beleggingen. Koersen zijn indicatief en worden niet real-time bijgewerkt.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        ⚠️ De koersen op deze pagina zijn <strong>mock-waarden</strong> voor demonstratiedoeleinden.
        Raadpleeg je broker voor actuele koersen. Dit is geen financieel advies.
      </div>

      {/* Summary bar */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Totaal belegd</p>
          <p className="text-lg font-semibold text-gray-900">{fmt(totalInvested)}</p>
        </div>
        <div className="card space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Huidige waarde</p>
          <p className="text-lg font-semibold text-gray-900">{fmt(totalCurrent)}</p>
        </div>
        <div className="card space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Rendement</p>
          <p
            className={`text-lg font-semibold ${totalPnl >= 0 ? "text-emerald-600" : "text-red-600"}`}
          >
            {totalPnl >= 0 ? "+" : ""}
            {fmt(totalPnl)} ({fmtPct(totalPnlPct)})
          </p>
        </div>
      </div>

      {/* Positions table */}
      {positions.length === 0 ? (
        <div className="card text-center py-10 space-y-3">
          <div className="text-4xl">📭</div>
          <p className="text-gray-500">Je hebt nog geen posities toegevoegd.</p>
          <p className="text-sm text-gray-400">
            Voeg hieronder je eerste positie toe om te beginnen.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-400 tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">ETF</th>
                <th className="px-4 py-3 text-right">Eenheden</th>
                <th className="px-4 py-3 text-right">Aankoopprijs</th>
                <th className="px-4 py-3 text-right">Huidige koers</th>
                <th className="px-4 py-3 text-right">Waarde</th>
                <th className="px-4 py-3 text-right">Rendement</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {positions.map((pos) => {
                const currentPrice = CURRENT_PRICES[pos.ticker] ?? pos.avgBuyPrice;
                const value = pos.units * currentPrice;
                const invested = pos.units * pos.avgBuyPrice;
                const pnl = value - invested;
                const pnlPct = (pnl / invested) * 100;
                return (
                  <tr key={pos.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{pos.ticker}</span>
                      <span className="block text-xs text-gray-400">{pos.etfName}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{pos.units}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(pos.avgBuyPrice)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(currentPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(value)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${pnl >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {pnl >= 0 ? "+" : ""}
                      {fmt(pnl)}
                      <span className="block text-xs">{fmtPct(pnlPct)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemove(pos.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Verwijder positie"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Allocatie per ETF</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => fmt(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add position form */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-primary-600" />
          Positie toevoegen
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">ETF</label>
            <select
              value={ticker}
              onChange={(e) => handleTickerChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              {MOCK_ETFS.map((etf) => (
                <option key={etf.ticker} value={etf.ticker}>
                  {etf.ticker} — {etf.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Eenheden</label>
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              placeholder="bv. 5"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Gem. aankoopprijs (€)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={avgBuyPrice}
              onChange={(e) => setAvgBuyPrice(e.target.value)}
              placeholder="bv. 88.50"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Aankoopdatum</label>
            <input
              type="date"
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleAdd}
            className="btn-primary flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Toevoegen
          </button>
          <Link href="/etfs" className="btn-secondary text-sm flex items-center gap-2">
            ETF&apos;s verkennen
          </Link>
        </div>
      </div>
    </div>
  );
}
