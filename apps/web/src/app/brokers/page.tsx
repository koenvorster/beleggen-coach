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

// ─── Data ────────────────────────────────────────────────────────────────────

interface Broker {
  id: string;
  name: string;
  color: string;
  transactiekosten: string;
  minTransactie: string;
  dcaPlan: boolean;
  fractioneel: boolean;
  belastingRapport: boolean;
  staatsgGarantie: boolean;
  depositoGarantie: string;
  tobAutomatisch: boolean | "gedeeltelijk";
  dividendBelasting: boolean | "gedeeltelijk";
  appKwaliteit: number;
  startBedrag: string;
  fsmaVergund: string;
  /** Vaste kost per transactie in EUR */
  kostenPerTransactie: number;
  /** Procentuele kost per transactie (bijv. 0.0003) */
  kostenPct: number;
}

const BROKERS: Broker[] = [
  {
    id: "bolero",
    name: "Bolero",
    color: "#2563eb",
    transactiekosten: "€7,50",
    minTransactie: "geen",
    dcaPlan: false,
    fractioneel: false,
    belastingRapport: true,
    staatsgGarantie: true,
    depositoGarantie: "€100K",
    tobAutomatisch: true,
    dividendBelasting: true,
    appKwaliteit: 3,
    startBedrag: "geen",
    fsmaVergund: "✅ BE",
    kostenPerTransactie: 7.5,
    kostenPct: 0,
  },
  {
    id: "keytrade",
    name: "Keytrade",
    color: "#16a34a",
    transactiekosten: "€9,75",
    minTransactie: "geen",
    dcaPlan: false,
    fractioneel: false,
    belastingRapport: true,
    staatsgGarantie: true,
    depositoGarantie: "€100K",
    tobAutomatisch: true,
    dividendBelasting: true,
    appKwaliteit: 2,
    startBedrag: "geen",
    fsmaVergund: "✅ BE",
    kostenPerTransactie: 9.75,
    kostenPct: 0,
  },
  {
    id: "degiro",
    name: "Degiro",
    color: "#ea580c",
    transactiekosten: "€2 + 0,03%",
    minTransactie: "€1",
    dcaPlan: false,
    fractioneel: false,
    belastingRapport: false,
    staatsgGarantie: true,
    depositoGarantie: "€20K",
    tobAutomatisch: false,
    dividendBelasting: "gedeeltelijk",
    appKwaliteit: 4,
    startBedrag: "geen",
    fsmaVergund: "✅ NL",
    kostenPerTransactie: 2,
    kostenPct: 0.0003,
  },
  {
    id: "traderepublic",
    name: "Trade Republic",
    color: "#7c3aed",
    transactiekosten: "€1",
    minTransactie: "€1",
    dcaPlan: true,
    fractioneel: true,
    belastingRapport: false,
    staatsgGarantie: true,
    depositoGarantie: "€100K",
    tobAutomatisch: false,
    dividendBelasting: false,
    appKwaliteit: 5,
    startBedrag: "€1",
    fsmaVergund: "✅ DE",
    kostenPerTransactie: 1,
    kostenPct: 0,
  },
];

// ─── Helper components ────────────────────────────────────────────────────────

function Stars({ count }: { count: number }) {
  return (
    <span className="text-yellow-400">
      {"⭐".repeat(count)}
      {"☆".repeat(5 - count)}
    </span>
  );
}

function BoolCell({ value }: { value: boolean | "gedeeltelijk" | string }) {
  if (value === true) return <span className="text-green-600 font-semibold">✅</span>;
  if (value === false) return <span className="text-red-500 font-semibold">❌</span>;
  return <span className="text-orange-500 font-semibold text-xs">{value}</span>;
}

// ─── Recommendation tool ──────────────────────────────────────────────────────

type BeleggingStijl = "zelf" | "dca" | "beide";
type BelastingBelang = "belangrijk" | "maakt-niet-uit";
type MaandBedrag = "klein" | "middel" | "groot";
type Beginner = "ja" | "nee";

interface Antwoorden {
  stijl: BeleggingStijl | null;
  belasting: BelastingBelang | null;
  bedrag: MaandBedrag | null;
  beginner: Beginner | null;
}

function berekenScores(antwoorden: Antwoorden): Record<string, number> {
  const scores: Record<string, number> = {
    bolero: 0,
    keytrade: 0,
    degiro: 0,
    traderepublic: 0,
  };

  if (antwoorden.stijl === "dca" || antwoorden.stijl === "beide") {
    scores.traderepublic += 3;
  }
  if (antwoorden.stijl === "zelf") {
    scores.degiro += 1;
    scores.bolero += 1;
  }
  if (antwoorden.belasting === "belangrijk") {
    scores.bolero += 2;
    scores.keytrade += 2;
  }
  if (antwoorden.bedrag === "klein") {
    scores.traderepublic += 2;
  }
  if (antwoorden.bedrag === "groot") {
    scores.bolero += 1;
    scores.keytrade += 1;
  }
  if (antwoorden.beginner === "ja") {
    scores.traderepublic += 1;
  }

  return scores;
}

function AanbevelingRedenering({
  winnaar,
  antwoorden,
}: {
  winnaar: Broker;
  antwoorden: Antwoorden;
}) {
  const redenen: string[] = [];
  const waarschuwingen: string[] = [];

  if (antwoorden.stijl === "dca" || antwoorden.stijl === "beide") {
    redenen.push("Je wil automatisch beleggen (DCA plan beschikbaar)");
  }
  if (antwoorden.bedrag === "klein") {
    redenen.push("Je beleg kleine bedragen (fractionele aandelen mogelijk vanaf €1)");
  }
  if (antwoorden.beginner === "ja") {
    redenen.push("De app is heel gebruiksvriendelijk voor beginners");
  }
  if (antwoorden.belasting === "belangrijk") {
    redenen.push("Belgische belastingdocumenten worden automatisch voorzien");
  }

  if (!winnaar.tobAutomatisch) {
    waarschuwingen.push("je moet zelf TOB (0,35%) aangeven bij FOD Financiën");
  }
  if (!winnaar.belastingRapport) {
    waarschuwingen.push("geen automatische Belgische belastingdocumenten — houd je transacties bij");
  }

  return (
    <div className="mt-4 space-y-3">
      {redenen.length > 0 && (
        <ul className="space-y-1">
          {redenen.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-500 mt-0.5">✓</span>
              {r}
            </li>
          ))}
        </ul>
      )}
      {waarschuwingen.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
          {waarschuwingen.map((w, i) => (
            <p key={i} className="text-sm text-amber-800">
              ⚠️ Let op: {w}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function AanbevelingTool() {
  const [antwoorden, setAntwoorden] = useState<Antwoorden>({
    stijl: null,
    belasting: null,
    bedrag: null,
    beginner: null,
  });

  const isCompleet = Object.values(antwoorden).every((v) => v !== null);

  const { winnaarId, scores } = useMemo(() => {
    const s = berekenScores(antwoorden);
    const winnaarId = Object.entries(s).sort((a, b) => b[1] - a[1])[0][0];
    return { winnaarId, scores: s };
  }, [antwoorden]);

  const winnaarBroker = BROKERS.find((b) => b.id === winnaarId)!;

  function RadioGroup<T extends string>({
    vraag,
    opties,
    value,
    onChange,
  }: {
    vraag: string;
    opties: { value: T; label: string }[];
    value: T | null;
    onChange: (v: T) => void;
  }) {
    return (
      <div className="space-y-2">
        <p className="font-medium text-gray-800">{vraag}</p>
        <div className="flex flex-wrap gap-2">
          {opties.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                value === opt.value
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-gray-700 border-gray-200 hover:border-primary-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-6">
      <h2 className="text-xl font-bold text-gray-900">🎯 Welke broker past bij jou?</h2>

      <RadioGroup<BeleggingStijl>
        vraag="Hoe wil je beleggen?"
        opties={[
          { value: "zelf", label: "Zelf handelen" },
          { value: "dca", label: "Automatisch DCA plan" },
          { value: "beide", label: "Beide" },
        ]}
        value={antwoorden.stijl}
        onChange={(v) => setAntwoorden((a) => ({ ...a, stijl: v }))}
      />

      <RadioGroup<BelastingBelang>
        vraag="Hoe belangrijk is Belgische belastinghulp?"
        opties={[
          { value: "belangrijk", label: "Heel belangrijk" },
          { value: "maakt-niet-uit", label: "Maakt niet uit" },
        ]}
        value={antwoorden.belasting}
        onChange={(v) => setAntwoorden((a) => ({ ...a, belasting: v }))}
      />

      <RadioGroup<MaandBedrag>
        vraag="Hoeveel beleg je per maand?"
        opties={[
          { value: "klein", label: "Minder dan €100" },
          { value: "middel", label: "€100 – €500" },
          { value: "groot", label: "Meer dan €500" },
        ]}
        value={antwoorden.bedrag}
        onChange={(v) => setAntwoorden((a) => ({ ...a, bedrag: v }))}
      />

      <RadioGroup<Beginner>
        vraag="Ben je beginner?"
        opties={[
          { value: "ja", label: "Ja" },
          { value: "nee", label: "Nee, ik heb al ervaring" },
        ]}
        value={antwoorden.beginner}
        onChange={(v) => setAntwoorden((a) => ({ ...a, beginner: v }))}
      />

      {isCompleet && (
        <div
          className="rounded-xl p-5 border-2 text-white"
          style={{ backgroundColor: winnaarBroker.color }}
        >
          <p className="text-sm font-medium opacity-80 mb-1">Aanbevolen broker</p>
          <h3 className="text-2xl font-bold">{winnaarBroker.name}</h3>
          <p className="text-sm opacity-90 mt-1">
            past het best bij jouw profiel omdat:
          </p>
          <AanbevelingRedenering winnaar={winnaarBroker} antwoorden={antwoorden} />
          <div className="mt-4 pt-3 border-t border-white/30 flex flex-wrap gap-2">
            {BROKERS.filter((b) => b.id !== winnaarId).map((b) => (
              <span
                key={b.id}
                className="text-xs bg-white/20 rounded-full px-3 py-1"
              >
                {b.name}: {scores[b.id]} pt
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cost simulator ───────────────────────────────────────────────────────────

function berekenJaarlijkseKosten(
  broker: Broker,
  maandBedrag: number
): number {
  const aantalTransacties = 12;
  const vasteKosten = broker.kostenPerTransactie * aantalTransacties;
  const variabeleKosten = broker.kostenPct * maandBedrag * aantalTransacties;
  return vasteKosten + variabeleKosten;
}

function KostenSimulator() {
  const [maandBedrag, setMaandBedrag] = useState(200);
  const [jaren, setJaren] = useState(10);

  const chartData = useMemo(() => {
    return Array.from({ length: jaren }, (_, i) => {
      const jaar = i + 1;
      const entry: Record<string, number> = { jaar };
      BROKERS.forEach((b) => {
        entry[b.id] = Math.round(berekenJaarlijkseKosten(b, maandBedrag) * jaar);
      });
      return entry;
    });
  }, [maandBedrag, jaren]);

  const eindKosten = chartData[chartData.length - 1] ?? {};
  const goedkoopste = BROKERS.reduce((prev, cur) =>
    (eindKosten[cur.id] ?? Infinity) < (eindKosten[prev.id] ?? Infinity) ? cur : prev
  );
  const duurste = BROKERS.reduce((prev, cur) =>
    (eindKosten[cur.id] ?? 0) > (eindKosten[prev.id] ?? 0) ? cur : prev
  );
  const besparing = (eindKosten[duurste.id] ?? 0) - (eindKosten[goedkoopste.id] ?? 0);

  return (
    <div className="card space-y-6">
      <h2 className="text-xl font-bold text-gray-900">💶 Kostensimulator</h2>
      <p className="text-sm text-gray-500">
        Bereken de totale transactiekosten bij maandelijks beleggen (1 aankoop/maand).
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Maandelijks bedrag: <span className="text-primary-600 font-bold">€{maandBedrag}</span>
          </label>
          <input
            type="range"
            min={50}
            max={2000}
            step={50}
            value={maandBedrag}
            onChange={(e) => setMaandBedrag(Number(e.target.value))}
            className="w-full accent-primary-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>€50</span><span>€2.000</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Periode: <span className="text-primary-600 font-bold">{jaren} jaar</span>
          </label>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={jaren}
            onChange={(e) => setJaren(Number(e.target.value))}
            className="w-full accent-primary-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>1 jaar</span><span>30 jaar</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="jaar"
            tickFormatter={(v: number) => `J${v}`}
            tick={{ fontSize: 12 }}
          />
          <YAxis tickFormatter={(v: number) => `€${v}`} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: number) => `€${v}`} labelFormatter={(l: number) => `Jaar ${l}`} />
          <Legend />
          {BROKERS.map((b) => (
            <Line
              key={b.id}
              type="monotone"
              dataKey={b.id}
              name={b.name}
              stroke={b.color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-sm text-primary-900">
        📊 Bij <strong>€{maandBedrag}/maand</strong> over <strong>{jaren} jaar</strong> bespaar je{" "}
        <strong>€{besparing}</strong> bij <strong>{goedkoopste.name}</strong> ten opzichte van{" "}
        <strong>{duurste.name}</strong>.
      </div>
    </div>
  );
}

// ─── Comparison table ─────────────────────────────────────────────────────────

function VergelijkingsTabel() {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-semibold text-gray-700 min-w-[200px]">
              Kenmerk
            </th>
            {BROKERS.map((b) => (
              <th
                key={b.id}
                className="px-4 py-3 font-bold text-center min-w-[130px]"
                style={{ color: b.color }}
              >
                {b.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {[
            {
              label: "Transactiekosten ETF",
              render: (b: Broker) => <span className="font-medium">{b.transactiekosten}</span>,
            },
            {
              label: "Minimale transactie",
              render: (b: Broker) => b.minTransactie,
            },
            {
              label: "Automatisch DCA plan",
              render: (b: Broker) => <BoolCell value={b.dcaPlan} />,
            },
            {
              label: "Fractionele aandelen",
              render: (b: Broker) => <BoolCell value={b.fractioneel} />,
            },
            {
              label: "Belgische belastingrapportering",
              render: (b: Broker) => <BoolCell value={b.belastingRapport} />,
            },
            {
              label: "Staatsgarantie beleggingen",
              render: (b: Broker) => <BoolCell value={b.staatsgGarantie} />,
            },
            {
              label: "Depositogarantie",
              render: (b: Broker) => b.depositoGarantie,
            },
            {
              label: "TOB automatisch afgehouden",
              render: (b: Broker) => <BoolCell value={b.tobAutomatisch} />,
            },
            {
              label: "Dividendbelasting aan bron",
              render: (b: Broker) => <BoolCell value={b.dividendBelasting} />,
            },
            {
              label: "App kwaliteit",
              render: (b: Broker) => <Stars count={b.appKwaliteit} />,
            },
            {
              label: "Minimaal startbedrag",
              render: (b: Broker) => b.startBedrag,
            },
            {
              label: "FSMA-vergund",
              render: (b: Broker) => b.fsmaVergund,
            },
          ].map((rij) => (
            <tr key={rij.label} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-600 font-medium">{rij.label}</td>
              {BROKERS.map((b) => (
                <td key={b.id} className="px-4 py-3 text-center">
                  {rij.render(b)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Warnings ─────────────────────────────────────────────────────────────────

function BelgischeWaarschuwingen() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-gray-900">⚠️ Belgische aandachtspunten</h2>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 text-sm text-amber-900">
        <p>
          <strong>Degiro:</strong> Je moet zelf de TOB (Taks op Beursverrichtingen, 0,35%) aangeven
          via de TOB-aangifte bij FOD Financiën. Dit is verplicht en kan tot boetes leiden bij
          nalatigheid.
        </p>
        <p>
          <strong>Trade Republic:</strong> Ook hier is de TOB niet automatisch — zelf aangeven
          is wettelijk verplicht.
        </p>
        <p>
          <strong>Degiro & Trade Republic:</strong> Geen automatische Belgische
          belastingdocumenten (fiches). Je moet zelf je buitenlandse rekening aangeven in de
          aangifte personenbelasting (code 1075/2075).
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrokersPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">🏦 Broker Vergelijker</h1>
        <p className="text-gray-500 max-w-2xl">
          De meest complete vergelijking van Belgische en populaire brokers. Ontdek welke broker
          het beste bij jouw beleggingsstijl past — inclusief alle Belgische fiscale aandachtspunten.
        </p>
      </div>

      {/* Aanbeveling tool */}
      <AanbevelingTool />

      {/* Vergelijkingstabel */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">📊 Volledige vergelijking</h2>
        <VergelijkingsTabel />
      </div>

      {/* Kostensimulator */}
      <KostenSimulator />

      {/* Waarschuwingen */}
      <BelgischeWaarschuwingen />

      {/* Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-600">📋 Disclaimer</p>
        <p>
          Deze vergelijking is louter educatief en bevat geen gesponsorde content. Tarieven,
          voorwaarden en regelgeving kunnen wijzigen — raadpleeg steeds de officiële website van de
          broker voor de meest actuele informatie. Dit is geen financieel advies.
        </p>
      </div>
    </div>
  );
}
