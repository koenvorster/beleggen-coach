"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ── helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Compound growth: FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r */
function calcFV(pv: number, pmt: number, rMonthly: number, months: number) {
  if (rMonthly === 0) return pv + pmt * months;
  const factor = Math.pow(1 + rMonthly, months);
  return pv * factor + pmt * ((factor - 1) / rMonthly);
}

/** Returns number of months to reach target, or null if not reached within 600 months */
function monthsToFire(
  pv: number,
  pmt: number,
  rMonthly: number,
  target: number
): number | null {
  if (pv >= target) return 0;
  for (let m = 1; m <= 600; m++) {
    if (calcFV(pv, pmt, rMonthly, m) >= target) return m;
  }
  return null;
}

interface ChartPoint {
  jaar: number;
  optimistisch: number;
  realistisch: number;
  pessimistisch: number;
  fireTarget: number;
}

// ── sub-components ───────────────────────────────────────────────────────────

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="font-bold text-gray-900">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary-600"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer gap-4">
      <span className="text-sm text-gray-700 font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
          checked ? "bg-primary-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
            checked ? "translate-x-5 ml-0.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

function AccordionItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-800 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        {title}
        <span className="text-gray-400 text-lg">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-4 py-3 text-sm text-gray-600 space-y-1">{children}</div>}
    </div>
  );
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
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm space-y-1">
      <p className="font-semibold text-gray-700">Jaar {label}</p>
      {payload
        .filter((p) => p.name !== "fireTarget")
        .map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name.charAt(0).toUpperCase() + p.name.slice(1)}: {fmt(p.value)}
          </p>
        ))}
    </div>
  );
};

// ── main page ────────────────────────────────────────────────────────────────

export default function FirePage() {
  const [leeftijd, setLeeftijd] = useState(30);
  const [maanduitgaven, setMaanduitgaven] = useState(2500);
  const [gespaard, setGespaard] = useState(5000);
  const [maandsparen, setMaandsparen] = useState(300);
  const [rendement, setRendement] = useState(7);
  const [staatspensioen, setStaatspensioen] = useState(true);
  const [inflatie, setInflatie] = useState(true);

  const INFLATIE_RATE = 0.02;
  const STAATSPENSIOEN_NETTO = 800;

  const results = useMemo(() => {
    const jaaruitgaven = maanduitgaven * 12;
    const nettoUitgaven = staatspensioen
      ? Math.max(0, jaaruitgaven - STAATSPENSIOEN_NETTO * 12)
      : jaaruitgaven;
    const fireGetal = nettoUitgaven * 25;

    const reëelRendement = inflatie
      ? (rendement - INFLATIE_RATE * 100) / 100
      : rendement / 100;
    const rMaand = reëelRendement / 12;

    const rOpt = (rendement / 100 + 0.02) / 12;
    const rPess = Math.max(0, (rendement / 100 - 0.02) / 12 - INFLATIE_RATE / 12);

    const maandenOpt = monthsToFire(gespaard, maandsparen, rOpt, fireGetal);
    const maandenReal = monthsToFire(gespaard, maandsparen, rMaand, fireGetal);
    const maandenPess = monthsToFire(gespaard, maandsparen, rPess, fireGetal);

    const jarenReal = maandenReal !== null ? Math.ceil(maandenReal / 12) : null;
    const jarenOpt = maandenOpt !== null ? Math.ceil(maandenOpt / 12) : null;
    const jarenPess = maandenPess !== null ? Math.ceil(maandenPess / 12) : null;

    const pensioenLeeftijd = jarenReal !== null ? leeftijd + jarenReal : null;
    const passief = (fireGetal * 0.04) / 12;
    const voortgang = Math.min(100, (gespaard / fireGetal) * 100);

    const maxJaren = Math.min(50, (jarenReal ?? 30) + 10);
    const chartData: ChartPoint[] = [];
    for (let j = 0; j <= maxJaren; j++) {
      const m = j * 12;
      chartData.push({
        jaar: j,
        optimistisch: Math.round(calcFV(gespaard, maandsparen, rOpt, m)),
        realistisch: Math.round(calcFV(gespaard, maandsparen, rMaand, m)),
        pessimistisch: Math.round(calcFV(gespaard, maandsparen, rPess, m)),
        fireTarget: Math.round(fireGetal),
      });
    }

    return {
      fireGetal,
      jarenReal,
      jarenOpt,
      jarenPess,
      pensioenLeeftijd,
      passief,
      voortgang,
      chartData,
    };
  }, [leeftijd, maanduitgaven, gespaard, maandsparen, rendement, staatspensioen, inflatie]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">🔥 FIRE Calculator</h1>
        <p className="text-gray-500 text-sm">
          Financiële Onafhankelijkheid &amp; Vroegpensioen — bereken wanneer jij financieel vrij kunt zijn.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Stap 1 */}
        <div className="card space-y-5">
          <h2 className="font-semibold text-gray-900">Stap 1 · Basisgegevens</h2>

          <SliderField
            label="Huidige leeftijd"
            value={leeftijd}
            min={18}
            max={65}
            step={1}
            format={(v) => `${v} jaar`}
            onChange={setLeeftijd}
          />
          <SliderField
            label="Maandelijkse uitgaven"
            value={maanduitgaven}
            min={500}
            max={5000}
            step={50}
            format={fmt}
            onChange={setMaanduitgaven}
          />
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">Huidig gespaard vermogen</span>
              <span className="font-bold text-gray-900">{fmt(gespaard)}</span>
            </div>
            <input
              type="number"
              min={0}
              max={500000}
              step={500}
              value={gespaard}
              onChange={(e) =>
                setGespaard(Math.min(500000, Math.max(0, Number(e.target.value))))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <SliderField
            label="Maandelijks spaarbedrag"
            value={maandsparen}
            min={50}
            max={2000}
            step={50}
            format={fmt}
            onChange={setMaandsparen}
          />
        </div>

        {/* Stap 2 */}
        <div className="card space-y-5">
          <h2 className="font-semibold text-gray-900">Stap 2 · Aannames</h2>

          <SliderField
            label="Verwacht rendement per jaar"
            value={rendement}
            min={3}
            max={12}
            step={0.5}
            format={(v) => `${v}%`}
            onChange={setRendement}
          />

          <div className="space-y-4 pt-2 border-t border-gray-100">
            <Toggle
              label="Staatspensioen inrekenen (~€800/maand netto)"
              checked={staatspensioen}
              onChange={setStaatspensioen}
            />
            <Toggle
              label="Inflatie meenemen (2%/jaar)"
              checked={inflatie}
              onChange={setInflatie}
            />
          </div>

          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">ℹ️ Belgische context</p>
            <p>
              Het Belgisch bruto staatspensioen is ~€1 300/maand. Na RSZ-bijdragen en belasting
              reken je beter op ~€800/maand netto als aanvulling op je FIRE-inkomen.
            </p>
          </div>
        </div>
      </div>

      {/* Stap 3: Resultaten */}
      <div className="card space-y-6">
        <h2 className="font-semibold text-gray-900">Stap 3 · Resultaten</h2>

        <div className="text-center py-4 bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl">
          <p className="text-sm text-gray-500 mb-1">Jouw FIRE-getal</p>
          <p className="text-4xl font-extrabold text-primary-700">{fmt(results.fireGetal)}</p>
          <p className="text-xs text-gray-400 mt-1">
            = jaaruitgaven{staatspensioen ? " na staatspensioen" : ""} × 25 (4% onttrekkingsregel)
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Huidig vermogen</span>
            <span className="font-semibold text-gray-800">
              {fmt(gespaard)} / {fmt(results.fireGetal)} ({results.voortgang.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="bg-primary-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${results.voortgang}%` }}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              label: "Jaren tot FIRE",
              value: results.jarenReal !== null ? `${results.jarenReal} jaar` : "50+ jaar",
              sub: "realistisch scenario",
              color: "text-primary-600",
            },
            {
              label: "Geschatte pensioenleeftijd",
              value:
                results.pensioenLeeftijd !== null
                  ? `${results.pensioenLeeftijd} jaar`
                  : "na 68",
              sub: "realistisch scenario",
              color: "text-accent-600",
            },
            {
              label: "Maandelijks passief inkomen",
              value: fmt(results.passief),
              sub: "bij bereikte FIRE (4% regel)",
              color: "text-green-600",
            },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4 text-center space-y-1">
              <p className="text-xs text-gray-400">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          {[
            { label: "Pessimistisch (−2%)", jaren: results.jarenPess, kleur: "text-orange-500" },
            { label: "Realistisch", jaren: results.jarenReal, kleur: "text-primary-600" },
            { label: "Optimistisch (+2%)", jaren: results.jarenOpt, kleur: "text-blue-500" },
          ].map(({ label, jaren, kleur }) => (
            <div
              key={label}
              className="flex flex-col items-center border border-gray-100 rounded-xl p-3 gap-1"
            >
              <span className="text-xs text-gray-400">{label}</span>
              <span className={`font-bold text-lg ${kleur}`}>
                {jaren !== null ? `${jaren} jr` : "50+ jr"}
              </span>
              {jaren !== null && (
                <span className="text-xs text-gray-400">leeftijd {leeftijd + jaren}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Grafiek */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-6">Vermogensgroei naar FIRE</h2>
        <ResponsiveContainer width="100%" height={360}>
          <AreaChart
            data={results.chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="gradOpt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value: string) =>
                value.charAt(0).toUpperCase() + value.slice(1)
              }
            />
            {results.jarenReal !== null && (
              <ReferenceLine
                x={results.jarenReal}
                stroke="#10b981"
                strokeDasharray="4 3"
                label={{
                  value: "🔥 FIRE",
                  position: "top",
                  fontSize: 11,
                  fill: "#10b981",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="pessimistisch"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#gradPess)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="realistisch"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#gradReal)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="optimistisch"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#gradOpt)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* FIRE types accordion */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-900">Welk type FIRE past bij jou?</h2>
        <div className="space-y-2">
          <AccordionItem title="🥗 Lean FIRE — basisbehoeften">
            <p>
              Lean FIRE richt zich op een minimale levensstijl. Jaarlijkse uitgaven onder ~€15 000.
              FIRE-getal: ~€375 000. Minder vermogen nodig, maar weinig financiële buffer voor
              onverwachte kosten.
            </p>
          </AccordionItem>
          <AccordionItem title="🏡 Reguliere FIRE — comfortabel leven">
            <p>
              De meest voorkomende vorm. Jaarlijkse uitgaven ~€24 000–€36 000 (€2 000–€3 000/maand).
              FIRE-getal: €600 000–€900 000. Voldoende ruimte voor reizen, hobby&apos;s en onverwachte
              uitgaven.
            </p>
          </AccordionItem>
          <AccordionItem title="🏖️ Fat FIRE — luxueus leven">
            <p>
              Fat FIRE streeft naar een ruim leven zonder compromissen. Uitgaven &gt;€48 000/jaar.
              FIRE-getal: &gt;€1 200 000. Vereist een hoog inkomen of lang sparen.
            </p>
          </AccordionItem>
          <AccordionItem title="🇧🇪 Belgisch FIRE — belastingen &amp; regels">
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong>TOB (Beurstaks):</strong> 0,35% bij aankoop/verkoop van aandelen-ETF&apos;s
                (accumulerend). Minimaliseer transacties.
              </li>
              <li>
                <strong>Meerwaardebelasting (2026):</strong> 10% op vermogenswinsten boven
                €1 000 000. Relevante drempel voor Fat FIRE-planners.
              </li>
              <li>
                <strong>Reynders-taks:</strong> 30% roerende voorheffing op rente-component van
                obligatie-ETF&apos;s. Kies pure aandelen-ETF&apos;s of accumulerende varianten om dit te
                vermijden.
              </li>
              <li>
                <strong>Kaaimantaks:</strong> Belasting op inkomsten via buitenlandse
                constructies. Niet van toepassing voor gewone ETF-beleggers.
              </li>
            </ul>
          </AccordionItem>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
        <p className="font-semibold">⚠️ Educatieve simulatie — geen financieel advies</p>
        <p>
          Deze calculator is uitsluitend bedoeld als educatief hulpmiddel op basis van historische
          gemiddelden en vereenvoudigde aannames. Rendementen uit het verleden bieden geen garantie
          voor de toekomst. Raadpleeg een erkend financieel adviseur voor persoonlijk advies.
          BeleggenCoach geeft geen beleggingsadvies in de zin van MiFID II.
        </p>
      </div>
    </div>
  );
}
