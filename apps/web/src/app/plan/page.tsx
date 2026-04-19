"use client";

import { useEffect, useState } from "react";
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
import { loadProfile, getSuggestedETF, riskLabel, type UserProfile } from "@/lib/profile";
import { api, type BackendETF } from "@/lib/api";

const DEFAULT_MONTHLY = 200;
const DEFAULT_YEARS = 20;

function calcGrowth(monthly: number, years: number, rate: number) {
  const data = [];
  for (let y = 0; y <= years; y++) {
    const months = y * 12;
    const r = rate / 12;
    const value =
      r === 0 ? monthly * months : monthly * ((Math.pow(1 + r, months) - 1) / r);
    data.push({ jaar: y, value: Math.round(value) });
  }
  return data;
}

function fmt(n: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: number;
}) => {
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
};

const RISK_EXPLANATIONS: Record<UserProfile["risk"], string> = {
  rustig:
    "Jouw profiel: voorzichtig. Overweeg een mix van obligaties en aandelen voor meer stabiliteit.",
  licht: "Jouw profiel: evenwichtig. Een wereldwijde ETF past goed bij jouw risicotolerantie.",
  accepteer:
    "Jouw profiel: groeigericht. Aandelen-ETF's met hoge spreiding zijn logisch voor de lange termijn.",
};

export default function PlanPage() {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [suggestedETF, setSuggestedETF] = useState<BackendETF | null>(null);

  // Laad profiel uit localStorage (migratie naar backend is een aparte taak)
  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  // Haal ETF-data op zodra profiel bekend is
  useEffect(() => {
    const ticker = profile ? getSuggestedETF(profile.risk) : "VWCE";

    api.etfs
      .list()
      .then((etfs) => {
        const match = etfs.find((e) => e.ticker === ticker) ?? etfs[0] ?? null;
        setSuggestedETF(match);
      })
      .catch(() => {
        // Graceful degradation — ETF-sectie wordt weggelaten bij API-fout
        setSuggestedETF(null);
      });
  }, [profile]);

  if (profile === undefined) return null;

  const monthly = profile?.monthly ?? DEFAULT_MONTHLY;
  const years = profile?.years ?? DEFAULT_YEARS;

  const pessimistic = calcGrowth(monthly, years, 0.03);
  const realistic = calcGrowth(monthly, years, 0.06);
  const optimistic = calcGrowth(monthly, years, 0.09);

  const chartData = pessimistic.map((d, i) => ({
    jaar: d.jaar,
    pessimistisch: d.value,
    realistisch: realistic[i].value,
    optimistisch: optimistic[i].value,
  }));

  const finalRealistic = chartData[years].realistisch;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Mijn beleggingsplan</h1>
        <p className="text-gray-500">
          Simulatie op basis van €{monthly}/maand over {years} jaar — drie scenario&apos;s.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Pessimistisch (3%)", value: chartData[years].pessimistisch, color: "text-orange-500" },
          { label: "Realistisch (6%)", value: chartData[years].realistisch, color: "text-primary-600" },
          { label: "Optimistisch (9%)", value: chartData[years].optimistisch, color: "text-accent-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center space-y-1">
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{fmt(value)}</p>
            <p className="text-xs text-gray-400">na {years} jaar</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-6">
          Groeisimulatie — €{monthly}/maand
        </h2>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="jaar"
              tickFormatter={(v) => `J${v}`}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
            />
            <YAxis
              tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
            />
            <Line type="monotone" dataKey="pessimistisch" stroke="#f97316" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="realistisch" stroke="#10b981" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="optimistisch" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Explanation */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-gray-900">Wat betekent dit?</h3>
        <p className="text-sm text-gray-600">
          Bij een realistisch rendement van 6% per jaar zou €{monthly}/maand na {years} jaar
          uitgroeien tot{" "}
          <strong className="text-primary-600">{fmt(finalRealistic)}</strong>. Je totale inleg
          bedraagt slechts {fmt(monthly * years * 12)} — de rest is rente-op-rente.
        </p>
        <ul className="text-sm text-gray-500 space-y-1 list-disc list-inside">
          <li>
            <strong>Pessimistisch (3%)</strong>: lage groei, vergelijkbaar met een spaarrekening
            met extra risico.
          </li>
          <li>
            <strong>Realistisch (6%)</strong>: historisch gemiddeld rendement van wereldwijde
            aandelenmarkten.
          </li>
          <li>
            <strong>Optimistisch (9%)</strong>: bovengemiddelde groei, zeker niet gegarandeerd.
          </li>
        </ul>
      </div>

      {/* Suggested ETF — graceful degradation als API niet reageert */}
      {suggestedETF && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-900">Passend ETF voor jouw profiel</h3>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <p className="font-bold text-gray-900">
                {suggestedETF.ticker} — {suggestedETF.naam}
              </p>
              <p className="text-sm text-gray-500 mt-1">{suggestedETF.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                TER: {(suggestedETF.expense_ratio * 100).toFixed(2)}% ·{" "}
                AUM: €{suggestedETF.aum_miljard_eur.toFixed(1)} mrd ·{" "}
                {suggestedETF.accumulating ? "Accumulerend" : "Uitkerend"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Risk explanation */}
      {profile && (
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 space-y-2">
          <h3 className="font-semibold text-primary-800">Risico-uitleg</h3>
          <p className="text-sm text-gray-700">{RISK_EXPLANATIONS[profile.risk]}</p>
          <p className="text-xs text-gray-500">
            Profiel: <strong>{riskLabel(profile.risk)}</strong>
          </p>
        </div>
      )}

      {/* Discipline tips */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-gray-900">💪 Disciplinetips</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary-500 font-bold mt-0.5">1.</span>
            Leg vast in op dezelfde dag van de maand — automatiseer dit via je bank.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 font-bold mt-0.5">2.</span>
            Kijk niet dagelijks naar koersen — controleer maximaal één keer per maand.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 font-bold mt-0.5">3.</span>
            Verhoog je inleg als je salaris stijgt — zelfs €25 extra per maand maakt een groot
            verschil op lange termijn.
          </li>
        </ul>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
        <p><strong>⚠️ Simulatie — geen garantie op rendement</strong></p>
        <p>
          Deze simulatie is puur indicatief op basis van vaste hypothetische rendementen.
          Echte beleggingsresultaten zijn afhankelijk van marktomstandigheden en kunnen
          significant afwijken. In het verleden behaalde resultaten bieden geen garantie
          voor de toekomst. BeleggenCoach geeft geen beleggingsadvies in de zin van MiFID II.
        </p>
      </div>
    </div>
  );
}
