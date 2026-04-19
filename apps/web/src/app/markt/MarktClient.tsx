"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api, type MarktIndex, type KoersDataPunt } from "@/lib/api";
import AntiPanicMode from "@/components/coaching/AntiPanicMode";

// ─── Configuratie ─────────────────────────────────────────────────────────────

const MARKT_INDICES = [
  { ticker: "^GSPC", naam: "S&P 500" },
  { ticker: "IWDA.AS", naam: "MSCI World (IWDA)" },
  { ticker: "^AEX", naam: "AEX Index" },
  { ticker: "^BFX", naam: "BEL 20" },
  { ticker: "VWCE.DE", naam: "VWCE ETF" },
  { ticker: "^IXIC", naam: "NASDAQ" },
];

const PERIODES = [
  { label: "1M", value: "1m" },
  { label: "3M", value: "3m" },
  { label: "6M", value: "6m" },
  { label: "1J", value: "1y" },
  { label: "3J", value: "3y" },
];

const INDEX_UITLEG: Record<string, { titel: string; uitleg: string }> = {
  "^GSPC": {
    titel: "S&P 500",
    uitleg:
      "De 500 grootste Amerikaanse bedrijven. Dit is dé graadmeter voor de Amerikaanse economie. " +
      "Stijging = beleggers vertrouwen de economie. Daling = onzekerheid of recessievrees.",
  },
  "IWDA.AS": {
    titel: "MSCI World (IWDA)",
    uitleg:
      "~1.400 bedrijven uit 23 ontwikkelde landen. Breed gespreid, minder risico dan S&P 500 alleen. " +
      "De iShares Core MSCI World ETF (IWDA) volgt deze index en is populair bij Europese beleggers.",
  },
  "^AEX": {
    titel: "AEX Index",
    uitleg:
      "De 25 grootste Nederlandse bedrijven, zoals ASML, Shell en Unilever. Meer volatiel dan wereldwijde " +
      "indices omdat Nederland kleiner en meer geconcentreerd is.",
  },
  "^BFX": {
    titel: "BEL 20",
    uitleg:
      "De 20 grootste Belgische bedrijven, waaronder KBC, AB InBev en UCB. " +
      "Een goede thermometer voor de Belgische economie.",
  },
  "VWCE.DE": {
    titel: "VWCE ETF",
    uitleg:
      "De Vanguard FTSE All-World Accumulating ETF. Belegt in ~3.700 aandelen wereldwijd, inclusief " +
      "opkomende markten. Dividenden worden automatisch herbelegd ('accumulating').",
  },
  "^IXIC": {
    titel: "NASDAQ",
    uitleg:
      "De NASDAQ Composite omvat ruim 3.000 technologiebedrijven, waaronder Apple, Microsoft en Amazon. " +
      "Hogere groeipotentie maar ook meer schommelingen dan de brede S&P 500.",
  },
};

// ─── Mock data (fallback als backend niet beschikbaar is) ─────────────────────

const MOCK_INDICES: MarktIndex[] = [
  { ticker: "^GSPC", naam: "S&P 500", huidige_koers: 5234.18, wijziging_pct: 0.42, wijziging_eur: 21.84, valuta: "USD" },
  { ticker: "IWDA.AS", naam: "MSCI World (IWDA)", huidige_koers: 91.23, wijziging_pct: 0.31, wijziging_eur: 0.28, valuta: "EUR" },
  { ticker: "^AEX", naam: "AEX Index", huidige_koers: 918.45, wijziging_pct: -0.15, wijziging_eur: -1.38, valuta: "EUR" },
  { ticker: "^BFX", naam: "BEL 20", huidige_koers: 4123.56, wijziging_pct: 0.22, wijziging_eur: 9.07, valuta: "EUR" },
  { ticker: "VWCE.DE", naam: "VWCE ETF", huidige_koers: 113.45, wijziging_pct: 0.38, wijziging_eur: 0.43, valuta: "EUR" },
  { ticker: "^IXIC", naam: "NASDAQ", huidige_koers: 16340.87, wijziging_pct: -0.55, wijziging_eur: -90.37, valuta: "USD" },
];

function generateMockHistory(periode: string): KoersDataPunt[] {
  const dagenMap: Record<string, number> = { "1m": 30, "3m": 90, "6m": 180, "1y": 365, "3y": 1095 };
  const dagen = dagenMap[periode] ?? 365;
  const today = new Date();
  const punten: KoersDataPunt[] = [];
  let koers = 5000 + Math.random() * 500;
  for (let i = dagen; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    koers = koers * (1 + (Math.random() - 0.48) * 0.015);
    punten.push({
      datum: d.toISOString().slice(0, 10),
      koers: Math.round(koers * 100) / 100,
    });
  }
  return punten;
}

// ─── Hulpfuncties ─────────────────────────────────────────────────────────────

function formatDatum(datum: string): string {
  const d = new Date(datum);
  return d.toLocaleDateString("nl-NL", { month: "short", year: "2-digit" });
}

function formatKoers(koers: number, valuta: string): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: valuta,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(koers);
}

// ─── Sub-componenten ──────────────────────────────────────────────────────────

function IndexKaart({ index }: { index: MarktIndex }) {
  const pos = index.wijziging_pct >= 0;
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
      data-testid={`index-kaart-${index.ticker.replace(/[^a-z0-9]/gi, "")}`}
    >
      <div className="flex items-start justify-between mb-1">
        <span className="text-xs font-mono text-gray-400">{index.ticker}</span>
        <span className="text-xs text-gray-400">{index.valuta}</span>
      </div>
      <p className="font-semibold text-gray-900 text-sm mb-2">{index.naam}</p>
      <p className="text-xl font-bold text-gray-900">
        {index.huidige_koers.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${pos ? "text-green-600" : "text-red-500"}`}>
        <span>{pos ? "▲" : "▼"}</span>
        <span>{Math.abs(index.wijziging_pct).toFixed(2)}%</span>
        <span className="text-xs font-normal opacity-75">
          ({pos ? "+" : ""}{index.wijziging_eur.toFixed(2)})
        </span>
      </div>
    </div>
  );
}

function IndexKaartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse" aria-hidden="true">
      <div className="h-3 bg-gray-100 rounded w-16 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-1/3" />
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const koers = payload[0].value;
  const d = new Date(label ?? "");
  const datumStr = d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-gray-500">{datumStr}</p>
      <p className="font-bold text-gray-900">{koers.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}</p>
    </div>
  );
}

function AccordionItem({
  ticker,
  titel,
  uitleg,
  open,
  onToggle,
}: {
  ticker: string;
  titel: string;
  uitleg: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="font-semibold text-gray-800">{titel}</span>
        <span className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="px-4 py-3 text-sm text-gray-600 leading-relaxed bg-white">
          {uitleg}
        </div>
      )}
    </div>
  );
}

// ─── Hoofdcomponent ───────────────────────────────────────────────────────────

export default function MarktClient() {
  const [indices, setIndices] = useState<MarktIndex[]>([]);
  const [loadingIndices, setLoadingIndices] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);
  const [backendFout, setBackendFout] = useState(false);

  const [selectedTicker, setSelectedTicker] = useState("^GSPC");
  const [selectedPeriode, setSelectedPeriode] = useState("1y");
  const [history, setHistory] = useState<KoersDataPunt[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [openAccordion, setOpenAccordion] = useState<string | null>("^GSPC");

  const fetchIndices = useCallback(async () => {
    setLoadingIndices(true);
    setBackendFout(false);
    try {
      const data = await api.market.indices();
      if (data.length === 0) {
        setIndices(MOCK_INDICES);
        setIsDemoData(true);
      } else {
        setIndices(data);
        setIsDemoData(false);
      }
    } catch {
      setIndices(MOCK_INDICES);
      setIsDemoData(true);
      setBackendFout(true);
    } finally {
      setLoadingIndices(false);
    }
  }, []);

  const fetchHistory = useCallback(async (ticker: string, periode: string) => {
    setLoadingHistory(true);
    try {
      const data = await api.market.history(ticker, periode);
      setHistory(data.length > 0 ? data : generateMockHistory(periode));
    } catch {
      setHistory(generateMockHistory(periode));
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchIndices();
  }, [fetchIndices]);

  useEffect(() => {
    fetchHistory(selectedTicker, selectedPeriode);
  }, [selectedTicker, selectedPeriode, fetchHistory]);

  const isUp = history.length > 1 && history[history.length - 1].koers >= history[0].koers;
  const lineColor = isUp ? "#22c55e" : "#ef4444";
  const fillId = "koersGradient";

  const geselecteerdeIndex = MARKT_INDICES.find((i) => i.ticker === selectedTicker);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10" data-testid="markt-pagina">
      {/* Demo / fout banner */}
      {isDemoData && (
        <div
          className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800"
          data-testid="demo-banner"
        >
          <span className="text-lg">ℹ️</span>
          <div>
            <strong>Demo data</strong> — live koersen niet beschikbaar.
            {backendFout && (
              <button
                onClick={fetchIndices}
                className="ml-2 underline hover:no-underline font-medium"
              >
                Opnieuw proberen
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Sectie 1: Marktoverzicht ─────────────────────────────────────────── */}
      <section data-testid="markt-overzicht">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marktoverzicht</h1>
            <p className="text-sm text-gray-500 mt-0.5">Actuele koersen — vertraagd via Yahoo Finance</p>
          </div>
          <button
            onClick={fetchIndices}
            disabled={loadingIndices}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
            data-testid="refresh-knop"
          >
            <span className={loadingIndices ? "animate-spin" : ""}>↻</span>
            Vernieuwen
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {loadingIndices
            ? Array.from({ length: 6 }).map((_, i) => <IndexKaartSkeleton key={i} />)
            : indices.map((idx) => <IndexKaart key={idx.ticker} index={idx} />)}
        </div>
      </section>

      {/* ── Sectie 2: Koersgrafiek ───────────────────────────────────────────── */}
      <section data-testid="markt-grafiek" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <select
            value={selectedTicker}
            onChange={(e) => setSelectedTicker(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            data-testid="ticker-selectie"
          >
            {MARKT_INDICES.map((idx) => (
              <option key={idx.ticker} value={idx.ticker}>
                {idx.naam}
              </option>
            ))}
          </select>

          <div className="flex gap-1.5" data-testid="periode-knoppen">
            {PERIODES.map((p) => (
              <button
                key={p.value}
                onClick={() => setSelectedPeriode(p.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriode === p.value
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loadingHistory ? (
          <div className="h-[350px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Koersdata laden…</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={history} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="datum"
                tickFormatter={formatDatum}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => v.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="koers"
                stroke={lineColor}
                strokeWidth={2}
                fill={`url(#${fillId})`}
                dot={false}
                activeDot={{ r: 4, stroke: lineColor, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Uitlegkaartje naast grafiek */}
        {geselecteerdeIndex && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 border border-gray-100">
            <strong className="text-gray-700">{INDEX_UITLEG[geselecteerdeIndex.ticker]?.titel ?? geselecteerdeIndex.naam}</strong>
            {" — "}
            {INDEX_UITLEG[geselecteerdeIndex.ticker]?.uitleg ??
              "Selecteer een index voor meer informatie."}
          </div>
        )}
      </section>

      {/* ── Sectie 3: Uitleg per index ───────────────────────────────────────── */}
      <section data-testid="markt-uitleg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Wat betekent dit allemaal?</h2>
        <div className="space-y-2">
          {Object.entries(INDEX_UITLEG).map(([ticker, info]) => (
            <AccordionItem
              key={ticker}
              ticker={ticker}
              titel={info.titel}
              uitleg={info.uitleg}
              open={openAccordion === ticker}
              onToggle={() => setOpenAccordion(openAccordion === ticker ? null : ticker)}
            />
          ))}
        </div>
      </section>

      {/* ── Sectie 4: Disclaimer ─────────────────────────────────────────────── */}
      <div
        className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-8 text-sm text-amber-800"
        data-testid="markt-disclaimer"
      >
        <strong>⚠️ Disclaimer</strong> — Koersen zijn indicatief en worden vertraagd weergegeven via Yahoo Finance.
        Dit is geen realtime data en geen beleggingsadvies. Raadpleeg je broker voor actuele koersen.
      </div>

      {/* Anti-panic coaching widget */}
      <AntiPanicMode alwaysVisible={true} />
    </div>
  );
}
