"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { loadProfile, calcProjectedValue, type UserProfile } from "@/lib/profile";
import { MOCK_ETFS } from "@/lib/mock-etfs";

type Tab = "groei" | "etfs" | "gedrag";

function fmt(n: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function buildGrowthData(monthly: number, years: number) {
  const data: { jaar: string; realistisch: number; conservatief: number; ingelegd: number }[] = [];
  for (let y = 0; y <= years; y++) {
    data.push({
      jaar: `Jaar ${y}`,
      realistisch: Math.round(calcProjectedValue(monthly, y, 0.07)),
      conservatief: Math.round(calcProjectedValue(monthly, y, 0.04)),
      ingelegd: Math.round(monthly * 12 * y),
    });
  }
  return data;
}

const ETF_PERF_DATA = MOCK_ETFS.slice(0, 6).map((e) => ({
  ticker: e.ticker,
  "Beginner-fit": e.beginnerScore,
  "Discipline-fit": e.disciplineScore,
}));

const BEHAVIOR_DATA = [
  { maand: "Jan", ingelegd: 1, paniek: 0, fomo: 0 },
  { maand: "Feb", ingelegd: 1, paniek: 0, fomo: 0 },
  { maand: "Mrt", ingelegd: 1, paniek: 1, fomo: 0 },
  { maand: "Apr", ingelegd: 1, paniek: 0, fomo: 1 },
  { maand: "Mei", ingelegd: 0, paniek: 0, fomo: 0 },
  { maand: "Jun", ingelegd: 1, paniek: 0, fomo: 0 },
];

export default function AnalyticsPage() {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("groei");

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  if (profile === undefined) return null;

  const monthly = profile?.monthly ?? 100;
  const years = profile?.years ?? 10;
  const growthData = buildGrowthData(monthly, years);
  const finalValue = growthData[growthData.length - 1];

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "groei", label: "Portefeuillegroei", emoji: "📈" },
    { id: "etfs", label: "ETF-vergelijking", emoji: "⚖️" },
    { id: "gedrag", label: "Gedragspatronen", emoji: "🧠" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytisch overzicht</h1>
        <p className="text-gray-500 text-sm mt-1">
          Verleden, heden en toekomst van jouw beleggingstraject.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Maandelijkse inleg</p>
          <p className="text-xl font-bold text-gray-900">{fmt(monthly)}</p>
        </div>
        <div className="card space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Looptijd</p>
          <p className="text-xl font-bold text-gray-900">{years} jaar</p>
        </div>
        <div className="card space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Verwacht (7%)</p>
          <p className="text-xl font-bold text-primary-600">{fmt(finalValue.realistisch)}</p>
        </div>
        <div className="card space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Totaal ingelegd</p>
          <p className="text-xl font-bold text-gray-700">{fmt(finalValue.ingelegd)}</p>
          <p className="text-xs text-green-600 font-medium">
            +{fmt(finalValue.realistisch - finalValue.ingelegd)} rendement
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "groei" && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Simulatie portefeuillegroei</h2>
            <p className="text-sm text-gray-500">
              Wat jouw {fmt(monthly)}/maand doet over {years} jaar bij verschillende rendementen.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={growthData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="jaar" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [fmt(value), name]}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="realistisch"
                name="Optimistisch (7%)"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="conservatief"
                name="Conservatief (4%)"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="ingelegd"
                name="Ingelegd bedrag"
                stroke="#d1d5db"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400">
            ⚠️ Simulatie op basis van historische rendementen. Geen garantie op toekomstig
            resultaat. Zie{" "}
            <a href="/disclaimer" className="underline hover:text-gray-600">
              onze disclaimer
            </a>
            .
          </p>
        </div>
      )}

      {tab === "etfs" && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">ETF-scores vergelijking</h2>
            <p className="text-sm text-gray-500">
              Hoe scoren de populairste ETF&apos;s op beginnersvriendelijkheid en discipline?
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ETF_PERF_DATA} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="ticker" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Beginner-fit" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Discipline-fit" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            {MOCK_ETFS.slice(0, 6).map((e) => (
              <div key={e.ticker} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-xs font-bold text-primary-700">
                  {e.ticker}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{e.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{e.beginnerScoreExplanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "gedrag" && (
        <div className="space-y-6">
          <div className="card space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Jouw gedragspatronen</h2>
              <p className="text-sm text-gray-500">
                Overzicht van inlegen, panieksignalen en FOMO-momenten op basis van check-ins.
              </p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={BEHAVIOR_DATA} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="maand" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ingelegd" name="Ingelegd ✅" fill="#4ade80" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paniek" name="Paniek ⚠️" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fomo" name="FOMO 🔥" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="card text-center space-y-2">
              <div className="text-3xl font-bold text-green-500">5/6</div>
              <p className="text-sm text-gray-600 font-medium">Maanden ingelegd</p>
              <p className="text-xs text-gray-400">Jij bent consistent! Geweldig 💪</p>
            </div>
            <div className="card text-center space-y-2">
              <div className="text-3xl font-bold text-yellow-500">1×</div>
              <p className="text-sm text-gray-600 font-medium">Panieksignaal</p>
              <p className="text-xs text-gray-400">Blijf je plan volgen — de dip gaat voorbij.</p>
            </div>
            <div className="card text-center space-y-2">
              <div className="text-3xl font-bold text-red-400">1×</div>
              <p className="text-sm text-gray-600 font-medium">FOMO-moment</p>
              <p className="text-xs text-gray-400">
                Herinner: je ETF dekt de markt al breed.
              </p>
            </div>
          </div>

          <div className="card bg-primary-50 border-primary-200 space-y-2">
            <p className="font-semibold text-primary-900">🧠 Gedragsscore: 83 / 100</p>
            <p className="text-sm text-primary-700">
              Je legt consistent in en toont weinig impulsief gedrag. Dat is het belangrijkste wat
              een beginner kan doen. Blijf dit volhouden!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
