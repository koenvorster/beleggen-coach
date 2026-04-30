"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface FearGreedData {
  current: {
    score: number;
    label: string;
    date: string;
  } | null;
  history: Array<{
    date: string;
    score: number;
    vix_level: number | null;
    momentum: number | null;
  }>;
}

const COLORS = {
  "Extreme Fear": "#dc2626",
  Fear: "#f97316",
  Neutral: "#f59e0b",
  Greed: "#84cc16",
  "Extreme Greed": "#22c55e",
};

export default function FearGreedWidget() {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/fear-greed")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">😨 Market Fear & Greed Index</h2>
        <div className="animate-pulse h-12 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!data?.current) {
    return null;
  }

  const { score, label } = data.current;
  const bgColor = COLORS[label as keyof typeof COLORS] || "#6366f1";
  const scorePercent = (score / 100) * 100;

  return (
    <div className="card space-y-6">
      <h2 className="font-semibold text-gray-900">😨 Market Fear & Greed Index</h2>

      {/* Score display */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-3xl font-bold text-gray-900">{score}</p>
            <p className="text-sm font-medium" style={{ color: bgColor }}>
              {label}
            </p>
          </div>
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: `${bgColor}20` }}>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: bgColor }}>
                {Math.round(scorePercent)}%
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Extreme Fear (0)</span>
            <span>Extreme Greed (100)</span>
          </div>
          <div className="w-full h-2 bg-gradient-to-r from-red-600 via-yellow-500 to-green-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 w-1 rounded-full"
              style={{ left: `${scorePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 30-day history chart */}
      {data.history && data.history.length > 1 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-600">30-daagse trend</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                formatter={(value) => `${value}/100`}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke={bgColor}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Interpretation */}
      <div className="p-3 rounded-lg" style={{ backgroundColor: `${bgColor}10` }}>
        <p className="text-sm" style={{ color: bgColor }}>
          <strong>{label === "Extreme Fear" || label === "Fear" ? "💔" : label === "Neutral" ? "😐" : "🤑"}</strong>{" "}
          {getInterpretation(label)}
        </p>
      </div>
    </div>
  );
}

function getInterpretation(label: string): string {
  switch (label) {
    case "Extreme Fear":
      return "Markten zijn erg nerveus. Historisch gezien een goed moment om voorzichtig in te stappen.";
    case "Fear":
      return "Markten zijn defensief. Zorg voor balans in je portfolio.";
    case "Neutral":
      return "Normale marktomstandigheden. Vaste inleg werkt hier goed.";
    case "Greed":
      return "Markten zijn bullish. Pas op voor overbodige risico's.";
    case "Extreme Greed":
      return "Markten zijn zeer optimistisch. Dit kan voorgaan op volatiliteit.";
    default:
      return "";
  }
}
