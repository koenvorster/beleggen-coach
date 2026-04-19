"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface AntiPanicModeProps {
  marketChangePercent?: number;
  alwaysVisible?: boolean;
}

const recoveryData = [
  { crash: "Dotcom (2000)", decline: -49, recoveryMonths: 56 },
  { crash: "Financieel (2008)", decline: -57, recoveryMonths: 48 },
  { crash: "COVID (2020)", decline: -34, recoveryMonths: 5 },
  { crash: "Inflatie (2022)", decline: -25, recoveryMonths: 18 },
];

const reasons = [
  {
    title: "Markttiming werkt niet",
    body: "De 10 beste beursdagen liggen bijna altijd vlak na een grote daling. Wie verkoopt, mist het herstel.",
  },
  {
    title: "Elke verkochte euro mist het herstel",
    body: "Historisch gezien herstelt de markt altijd. Wie belegd blijft, profiteert automatisch.",
  },
  {
    title: "VWCE herstelde na iedere crisis",
    body: "100% trackrecord: elke historische crash werd gevolgd door een nieuw all-time high.",
  },
];

export default function AntiPanicMode({
  marketChangePercent,
  alwaysVisible = false,
}: AntiPanicModeProps) {
  const [openReason, setOpenReason] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const isPanicking =
    alwaysVisible ||
    (marketChangePercent !== undefined && marketChangePercent <= -5);

  if (!isPanicking || dismissed) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-blue-900">
            📉 Markten dalen — maar dat is normaal
          </h2>
          <p className="text-blue-700 mt-1 text-sm">
            De S&amp;P 500 is gemiddeld{" "}
            <strong>14 maanden</strong> na een crash van 20%+ volledig hersteld.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-400 hover:text-blue-600 text-xl leading-none"
          aria-label="Sluiten"
        >
          ×
        </button>
      </div>

      {/* Statistiek */}
      <div className="bg-white rounded-xl p-4 border border-blue-100 text-sm text-gray-700">
        <span className="font-semibold text-blue-800">89%</span> van de
        beleggers die in paniek verkochten in 2020, kochten terug{" "}
        <span className="font-semibold text-red-600">tegen een hogere prijs</span>.
      </div>

      {/* Grafiek */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">
          Herstelperiode na grote crashes (maanden)
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={recoveryData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis
              dataKey="crash"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              unit=" mnd"
            />
            <Tooltip
              formatter={(v: number) => [`${v} maanden`, "Herstel"]}
              contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
            />
            <Bar dataKey="recoveryMonths" radius={[4, 4, 0, 0]}>
              {recoveryData.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === 2 ? "#22c55e" : "#6366f1"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 mt-1 text-center">
          Groen = COVID crash — snelste herstel ooit (5 maanden)
        </p>
      </div>

      {/* Redenen accordion */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">
          📖 Waarom ik niet verkoop
        </p>
        <div className="space-y-2">
          {reasons.map((r, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-blue-100 overflow-hidden"
            >
              <button
                className="w-full text-left px-4 py-3 text-sm font-medium text-blue-900 flex justify-between items-center"
                onClick={() => setOpenReason(openReason === i ? null : i)}
              >
                {r.title}
                <span className="text-blue-400">{openReason === i ? "▲" : "▼"}</span>
              </button>
              {openReason === i && (
                <div className="px-4 pb-3 text-sm text-gray-600">{r.body}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
