"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const HORIZONS = [1, 3, 5, 8, 10, 20, 30] as const;
type Horizon = (typeof HORIZONS)[number];

const STAATSBON_RATES = {
  "1j": 0.014,
  "8j": 0.0196,
} as const;
type StaatsbonType = keyof typeof STAATSBON_RATES;

const STAATSBON_TYPES: StaatsbonType[] = ["1j", "8j"];

const ETF_NET_RATE = 0.065; // VWCE ~7% bruto, na TER 0.22% en TOB-impact

interface StaatsbonVergelijkerProps {
  className?: string;
}

interface ChartDataPoint {
  jaar: number;
  etf: number;
  staatsbon: number;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: number;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function calcCompound(principal: number, rate: number, years: number): number {
  return principal * Math.pow(1 + rate, years);
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-md p-3 text-sm space-y-1">
      <p className="font-semibold text-gray-700">Jaar {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function StaatsbonVergelijker({ className }: StaatsbonVergelijkerProps) {
  const [bedrag, setBedrag] = useState(10000);
  const [horizon, setHorizon] = useState<Horizon>(10);
  const [staatsbonType, setStaatsbonType] = useState<StaatsbonType>("8j");

  const staatsbonRate = STAATSBON_RATES[staatsbonType];
  const staatsbonLabel =
    staatsbonType === "1j"
      ? "Staatsbon 1 jaar (1,40% netto)"
      : "Staatsbon 8 jaar (1,96% netto)";

  const chartData = useMemo<ChartDataPoint[]>(() => {
    const data: ChartDataPoint[] = [];
    for (let y = 0; y <= horizon; y++) {
      data.push({
        jaar: y,
        etf: Math.round(calcCompound(bedrag, ETF_NET_RATE, y)),
        staatsbon: Math.round(calcCompound(bedrag, staatsbonRate, y)),
      });
    }
    return data;
  }, [bedrag, horizon, staatsbonRate]);

  const eindETF = calcCompound(bedrag, ETF_NET_RATE, horizon);
  const eindSB = calcCompound(bedrag, staatsbonRate, horizon);
  const verschil = eindETF - eindSB;

  return (
    <div className={`card space-y-6 ${className ?? ""}`}>
      <div>
        <h2 className="text-xl font-bold text-gray-900">⚖️ Staatsbon vs ETF vergelijker</h2>
        <p className="text-sm text-gray-500 mt-1">
          Vergelijk een gegarandeerde Belgische staatsbon met een brede wereldwijde ETF (VWCE).
        </p>
      </div>

      {/* Inputs */}
      <div className="space-y-5">
        {/* Bedrag slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Bedrag</label>
            <span className="text-sm font-bold text-primary-600">{fmt(bedrag)}</span>
          </div>
          <input
            type="range"
            min={100}
            max={50000}
            step={100}
            value={bedrag}
            onChange={(e) => setBedrag(Number(e.target.value))}
            className="w-full accent-primary-500"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>€100</span>
            <span>€50.000</span>
          </div>
        </div>

        {/* Horizon */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Beleggingshorizon</label>
          <div className="flex flex-wrap gap-2">
            {HORIZONS.map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  horizon === h
                    ? "bg-primary-500 text-white border-primary-500"
                    : "border-gray-200 text-gray-600 hover:border-primary-300"
                }`}
              >
                {h} jaar
              </button>
            ))}
          </div>
        </div>

        {/* Staatsbon type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Staatsbon type</label>
          <div className="flex gap-3">
            {STAATSBON_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setStaatsbonType(type)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  staatsbonType === type
                    ? "bg-primary-500 text-white border-primary-500"
                    : "border-gray-200 text-gray-600 hover:border-primary-300"
                }`}
              >
                {type === "1j" ? "1 jaar — 1,40% netto" : "8 jaar — 1,96% netto"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grafiek */}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="jaar"
            tickFormatter={(v: number) => `J${v}`}
            tick={{ fontSize: 12, fill: "#9ca3af" }}
          />
          <YAxis
            tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="etf"
            name="ETF (VWCE ~6,5% netto)"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="staatsbon"
            name={staatsbonLabel}
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Resultaten */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">ETF eindwaarde</p>
          <p className="text-xl font-bold text-green-700">{fmt(eindETF)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Staatsbon eindwaarde</p>
          <p className="text-xl font-bold text-blue-700">{fmt(eindSB)}</p>
        </div>
        <div
          className={`rounded-xl p-4 text-center border ${
            verschil >= 0
              ? "bg-primary-50 border-primary-200"
              : "bg-orange-50 border-orange-200"
          }`}
        >
          <p className="text-xs text-gray-500 mb-1">Verschil na {horizon} jaar</p>
          <p
            className={`text-xl font-bold ${
              verschil >= 0 ? "text-primary-600" : "text-orange-600"
            }`}
          >
            {verschil >= 0 ? "+" : ""}
            {fmt(verschil)}
          </p>
        </div>
      </div>

      {/* Context */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <p className="font-semibold text-blue-700 text-sm">🏛️ Staatsbon</p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>Gegarandeerd door de Belgische overheid</li>
            <li>Geen risico op verlies van hoofdsom</li>
            <li>Lager rendement dan historisch ETF-gemiddelde</li>
            <li>Inflatie kan reëel rendement uithollen</li>
          </ul>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <p className="font-semibold text-green-700 text-sm">📈 ETF (VWCE)</p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>Hoger historisch rendement op lange termijn</li>
            <li>Brede spreiding: 3.700+ bedrijven wereldwijd</li>
            <li>Waarde kan tijdelijk dalen (volatiliteit)</li>
            <li>Geen garantie op historisch rendement</li>
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
        <strong>⚠️ Historisch rendement is geen garantie voor de toekomst.</strong> ETF-cijfers zijn
        gebaseerd op het historisch gemiddelde van VWCE (~7% bruto), na aftrek van TER (0,22%) en
        TOB-impact. Staatsbon-rentevoeten zijn indicatief — controleer actuele tarieven op{" "}
        <a
          href="https://www.nbbm-mnb.be"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          nbbm-mnb.be
        </a>
        .
      </div>
    </div>
  );
}
