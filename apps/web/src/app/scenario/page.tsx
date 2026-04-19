"use client";

import { useMemo, useState } from "react";
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

// ── helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function calcFV(pmt: number, rJaar: number, jaren: number) {
  const r = rJaar / 12;
  const n = jaren * 12;
  if (r === 0) return pmt * n;
  return pmt * ((Math.pow(1 + r, n) - 1) / r);
}

// ── types ────────────────────────────────────────────────────────────────────

interface Scenario {
  naam: string;
  maandBedrag: number;
  rendement: number;
  jaren: number;
  kleur: string;
}

const DEFAULTS: Scenario[] = [
  { naam: "Voorzichtig", maandBedrag: 150, rendement: 5, jaren: 20, kleur: "#3b82f6" },
  { naam: "Gemiddeld", maandBedrag: 400, rendement: 7, jaren: 25, kleur: "#10b981" },
  { naam: "Ambitieus", maandBedrag: 800, rendement: 9, jaren: 30, kleur: "#f97316" },
];

// ── sub-components ───────────────────────────────────────────────────────────

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  accentColor,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  accentColor?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-bold text-gray-800">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: accentColor }}
      />
    </div>
  );
}

const CustomTooltip = ({
  active,
  payload,
  label,
  scenarios,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: number;
  scenarios: Scenario[];
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm space-y-1">
      <p className="font-semibold text-gray-700">Jaar {label}</p>
      {payload.map((p) => {
        const sc = scenarios.find((s) => s.naam === p.name);
        return (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {fmt(p.value)}
            {sc && (
              <span className="text-gray-400 ml-1">
                (€{sc.maandBedrag}/mnd · {sc.rendement}%)
              </span>
            )}
          </p>
        );
      })}
    </div>
  );
};

// ── main page ────────────────────────────────────────────────────────────────

export default function ScenarioPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULTS);
  const [activeIdx, setActiveIdx] = useState(0);

  function updateScenario(idx: number, patch: Partial<Scenario>) {
    setScenarios((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  const active = scenarios[activeIdx];

  function applyWhatIf(patch: Partial<Scenario>) {
    updateScenario(activeIdx, patch);
  }

  const { chartData, results } = useMemo(() => {
    const maxJaren = Math.max(...scenarios.map((s) => s.jaren));

    const chartData: Record<string, number>[] = [];
    for (let j = 0; j <= maxJaren; j++) {
      const point: Record<string, number> = { jaar: j };
      scenarios.forEach((s) => {
        point[s.naam] = Math.round(calcFV(s.maandBedrag, s.rendement / 100, j));
      });
      chartData.push(point);
    }

    const results = scenarios.map((s) => {
      const eindvermogen = calcFV(s.maandBedrag, s.rendement / 100, s.jaren);
      const ingelegd = s.maandBedrag * s.jaren * 12;
      const winst = eindvermogen - ingelegd;
      const maandinkomen = (eindvermogen * 0.04) / 12;
      return { eindvermogen, ingelegd, winst, maandinkomen };
    });

    return { chartData, results };
  }, [scenarios]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">📊 Scenario Planner</h1>
        <p className="text-gray-500 text-sm">
          Vergelijk drie beleggingsscenario&apos;s naast elkaar en ontdek het verschil van kleine keuzes
          over de lange termijn.
        </p>
      </div>

      {/* Scenario kaarten */}
      <div className="grid md:grid-cols-3 gap-4">
        {scenarios.map((sc, idx) => {
          const res = results[idx];
          const isActive = idx === activeIdx;
          return (
            <div
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`card space-y-4 cursor-pointer transition-all border-2 ${
                isActive ? "border-primary-400 shadow-md" : "border-transparent"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: sc.kleur }}
                />
                <input
                  type="text"
                  value={sc.naam}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateScenario(idx, { naam: e.target.value })}
                  className="font-semibold text-gray-900 bg-transparent border-b border-dashed border-gray-300 focus:outline-none focus:border-primary-400 w-full text-sm"
                />
              </div>

              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <SliderField
                  label="Maandelijks beleggen"
                  value={sc.maandBedrag}
                  min={50}
                  max={2000}
                  step={50}
                  format={(v) => `€${v}`}
                  onChange={(v) => updateScenario(idx, { maandBedrag: v })}
                  accentColor={sc.kleur}
                />
                <SliderField
                  label="Rendement per jaar"
                  value={sc.rendement}
                  min={3}
                  max={12}
                  step={0.5}
                  format={(v) => `${v}%`}
                  onChange={(v) => updateScenario(idx, { rendement: v })}
                  accentColor={sc.kleur}
                />
                <SliderField
                  label="Duur"
                  value={sc.jaren}
                  min={5}
                  max={40}
                  step={1}
                  format={(v) => `${v} jaar`}
                  onChange={(v) => updateScenario(idx, { jaren: v })}
                  accentColor={sc.kleur}
                />
              </div>

              <div
                className="space-y-2 pt-3 border-t text-sm"
                style={{ borderColor: `${sc.kleur}33` }}
              >
                <div className="flex justify-between">
                  <span className="text-gray-500">Eindvermogen</span>
                  <span className="font-bold" style={{ color: sc.kleur }}>
                    {fmt(res.eindvermogen)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Ingelegd kapitaal</span>
                  <span className="text-gray-600">{fmt(res.ingelegd)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Winst (rente-op-rente)</span>
                  <span className="text-green-600 font-semibold">{fmt(res.winst)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Maandinkomen (4% regel)</span>
                  <span className="text-gray-700 font-semibold">{fmt(res.maandinkomen)}/mnd</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grafiek + tips */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Vermogensgroei over de tijd</h2>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="jaar"
                tickFormatter={(v: number) => `J${v}`}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
              />
              <YAxis
                tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                width={60}
              />
              <Tooltip
                content={<CustomTooltip scenarios={scenarios} />}
              />
              <Legend />
              {scenarios.map((sc) => (
                <Line
                  key={sc.naam}
                  type="monotone"
                  dataKey={sc.naam}
                  stroke={sc.kleur}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Belgische tips */}
        <div className="space-y-4">
          <div className="card space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">🇧🇪 Belgische context</h3>
            <div className="space-y-3 text-xs text-gray-600">
              <div className="bg-green-50 rounded-lg p-3 space-y-1">
                <p className="font-semibold text-green-800">💸 Kostenbesparing</p>
                <p>
                  Bij €500/maand over 30 jaar betaal je <strong>~€200 000 minder fees</strong> bij
                  een goedkope ETF (TER 0,2%) vergeleken met een actief fonds (TER 2%). Dat is
                  bijna het verschil van een volledig extra jaar vroegpensioen.
                </p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 space-y-1">
                <p className="font-semibold text-amber-800">📋 Beurstaks (TOB)</p>
                <p>
                  0,35% bij elke transactie voor aandelen-ETF&apos;s. Koop minder frequent — maandelijks
                  of kwartaalsgewijs — om TOB-kosten te beperken.
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 space-y-1">
                <p className="font-semibold text-blue-800">🏦 Accumulerend vs uitkerend</p>
                <p>
                  Accumulerende ETF&apos;s herinvesteren dividenden automatisch en zijn in België
                  fiscaal interessanter (geen 30% roerende voorheffing op dividenden).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wat-als simulaties */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-gray-900">🔮 &quot;Wat als&quot;-simulaties</h2>
          <span className="text-xs text-gray-400">
            Toegepast op scenario &quot;{active.naam}&quot;
          </span>
          <div className="ml-auto flex gap-2 flex-wrap">
            {scenarios.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  i === activeIdx
                    ? "text-white border-transparent"
                    : "text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
                style={i === activeIdx ? { backgroundColor: s.kleur, borderColor: s.kleur } : {}}
              >
                {s.naam}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            {
              label: "➕ €100/maand meer",
              action: () => applyWhatIf({ maandBedrag: Math.min(2000, active.maandBedrag + 100) }),
              style: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
            },
            {
              label: "➖ €100/maand minder",
              action: () => applyWhatIf({ maandBedrag: Math.max(50, active.maandBedrag - 100) }),
              style: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
            },
            {
              label: "⏰ 5 jaar eerder beginnen",
              action: () => applyWhatIf({ jaren: Math.min(40, active.jaren + 5) }),
              style: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
            },
            {
              label: "📅 5 jaar later beginnen",
              action: () => applyWhatIf({ jaren: Math.max(5, active.jaren - 5) }),
              style: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
            },
            {
              label: "📈 Rendement +1%",
              action: () => applyWhatIf({ rendement: Math.min(12, active.rendement + 1) }),
              style: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
            },
            {
              label: "📉 Rendement −1%",
              action: () => applyWhatIf({ rendement: Math.max(3, active.rendement - 1) }),
              style: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
            },
          ].map(({ label, action, style }) => (
            <button
              key={label}
              onClick={action}
              className={`text-sm px-4 py-2 border rounded-xl transition-colors ${style}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm bg-gray-50 rounded-xl p-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Huidig scenario &quot;{active.naam}&quot;</p>
            <p className="font-bold text-gray-800">
              €{active.maandBedrag}/mnd · {active.rendement}% · {active.jaren} jaar
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Eindvermogen</p>
            <p className="font-bold text-primary-600 text-lg">
              {fmt(results[activeIdx].eindvermogen)}
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
        <p className="font-semibold">⚠️ Educatieve simulatie — geen financieel advies</p>
        <p>
          Berekeningen zijn gebaseerd op constante jaarrendementen en vereenvoudigde aannames.
          Werkelijke rendementen fluctueren en kunnen significant afwijken. BeleggenCoach geeft
          geen beleggingsadvies in de zin van MiFID II.
        </p>
      </div>
    </div>
  );
}
