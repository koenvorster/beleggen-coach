"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import type { Risicoscan } from "@/lib/api";

interface RisicoscanWidgetProps {
  data: Risicoscan;
}

const GEO_KLEUREN: Record<string, string> = {
  "Noord-Amerika": "#3b82f6",
  Europa: "#10b981",
  Azië: "#f59e0b",
  Wereld: "#8b5cf6",
  "Opkomende markten": "#ef4444",
  Overig: "#6b7280",
};

function scoreKleurTekst(score: number): string {
  if (score <= 3) return "text-emerald-600";
  if (score <= 6) return "text-amber-500";
  return "text-red-500";
}

function scoreKleurKader(score: number): string {
  if (score <= 3) return "bg-emerald-50 border-emerald-200";
  if (score <= 6) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function AanbevelingIcoon({ tekst }: { tekst: string }) {
  const lc = tekst.toLowerCase();
  if (
    lc.includes("uitstekend") ||
    lc.includes("goede basis") ||
    lc.includes("evenwichtig") ||
    lc.includes("laag")
  ) {
    return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
  }
  if (lc.includes("overweeg")) {
    return <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
  }
  return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
}

export default function RisicoscanWidget({ data }: RisicoscanWidgetProps) {
  const geoData = Object.entries(data.geografisch).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="card space-y-6">
      {/* Header + score badge */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-semibold text-gray-900">Portfolio Risicoscan 🔍</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Indicatieve analyse van spreiding, kosten en concentratie
          </p>
        </div>
        <div
          className={`rounded-xl border px-5 py-2 text-center ${scoreKleurKader(data.score)}`}
        >
          <p className={`text-2xl font-bold ${scoreKleurTekst(data.score)}`}>
            {data.score}
            <span className="text-base font-normal text-gray-400">/10</span>
          </p>
          <p className="text-xs text-gray-500">risicoscore</p>
        </div>
      </div>

      {/* Beoordeling + TER */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className={`rounded-xl border p-4 space-y-1 ${scoreKleurKader(data.score)}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Beoordeling</p>
          <p className={`font-semibold ${scoreKleurTekst(data.score)}`}>{data.score_label}</p>
          <p className="text-xs text-gray-400">
            Niveau:{" "}
            <span className="capitalize font-medium text-gray-600">{data.risico_niveau}</span>
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Gewogen TER</p>
          <p className="font-semibold text-gray-900">{data.ter_gewogen.toFixed(2)}%/jaar</p>
          <p className="text-xs text-gray-400">
            {data.ter_gewogen < 0.25
              ? "✅ Lage kosten — efficiënte portefeuille"
              : "⚠️ Relatief hogere jaarlijkse kosten"}
          </p>
        </div>
      </div>

      {/* Geografische spreiding */}
      {geoData.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Geografische spreiding</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={geoData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }: { name: string; value: number }) =>
                  `${name} ${value}%`
                }
                labelLine={false}
              >
                {geoData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={GEO_KLEUREN[entry.name] ?? "#6b7280"}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Aanbevelingen */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Aanbevelingen</h3>
        <ul className="space-y-2">
          {data.aanbevelingen.map((tekst, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <AanbevelingIcoon tekst={tekst} />
              {tekst}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
        ⚠️ De risicoscan is indicatief en gebaseerd op mock-koersen. Dit is geen financieel
        advies. Raadpleeg een erkend adviseur (FSMA-vergund) voor persoonlijk advies.
      </p>
    </div>
  );
}
