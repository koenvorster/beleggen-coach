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
import StaatsbonVergelijker from "@/components/StaatsbonVergelijker";

// ─── Types ────────────────────────────────────────────────────────────────────

type EtfType = "accumulerend" | "uitkerend";

interface PensioengrafiekDataPoint {
  jaar: number;
  pensioensparen: number;
  etf: number;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2): string {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(n);
}

function fmtCompact(n: number): string {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-md p-3 text-sm space-y-1">
      <p className="font-semibold text-gray-700">Jaar {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmtCompact(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── Sectie 1: TOB Calculator ────────────────────────────────────────────────

function TobCalculator() {
  const [bedrag, setBedrag] = useState<string>("10000");
  const [etfType, setEtfType] = useState<EtfType>("accumulerend");

  const bedragNum = parseFloat(bedrag.replace(",", ".")) || 0;
  const tobRate = 0.0035; // 0,35% voor zowel accumulerende als uitkerende ETFs
  const tobBruto = bedragNum * tobRate;
  const tobCapped = Math.min(tobBruto, 1600);
  const nettoBedrag = bedragNum - tobCapped;
  const tobPct = bedragNum > 0 ? (tobCapped / bedragNum) * 100 : 0;

  return (
    <div className="card space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">🧾 TOB Calculator</h2>
        <p className="text-sm text-gray-500 mt-1">
          Beurstaks (Taks Op Beursverrichtingen) — betaald bij{" "}
          <strong>zowel aankoop als verkoop</strong> van ETFs in België.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Bedrag */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Transactiebedrag (€)</label>
          <input
            type="number"
            min={0}
            step={100}
            value={bedrag}
            onChange={(e) => setBedrag(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            placeholder="bv. 10000"
          />
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Type ETF</label>
          <div className="flex gap-2">
            {(["accumulerend", "uitkerend"] as EtfType[]).map((t) => (
              <button
                key={t}
                onClick={() => setEtfType(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  etfType === t
                    ? "bg-primary-500 text-white border-primary-500"
                    : "border-gray-200 text-gray-600 hover:border-primary-300"
                }`}
              >
                {t === "accumulerend" ? "Accumulerend" : "Uitkerend"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resultaat */}
      {bedragNum > 0 && (
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">TOB (0,35%)</p>
            <p className="text-xl font-bold text-orange-700">{fmt(tobCapped)}</p>
            {tobBruto > 1600 && (
              <p className="text-xs text-orange-500 mt-1">⚡ Cap van €1.600 toegepast</p>
            )}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">TOB als % van bedrag</p>
            <p className="text-xl font-bold text-blue-700">{tobPct.toFixed(3)}%</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Netto ontvangen/betaald</p>
            <p className="text-xl font-bold text-green-700">{fmt(nettoBedrag, 0)}</p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
        <p>
          <strong>ℹ️ Hoe werkt TOB?</strong>
        </p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Tarief: <strong>0,35%</strong> op de transactiewaarde (buitenlandse ETFs)</li>
          <li>Maximum: <strong>€1.600 per transactie</strong></li>
          <li>Van toepassing bij <strong>zowel aankoop als verkoop</strong></li>
          <li>Wordt automatisch ingehouden door je broker</li>
          <li>Accumulerende en uitkerende ETFs: beide 0,35%</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Sectie 2: Meerwaardebelasting ───────────────────────────────────────────

function Meerwaardebelasting() {
  return (
    <div className="card space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">📈 Meerwaardebelasting</h2>
        <p className="text-sm text-gray-500 mt-1">
          Belasting op de winst (meerwaarde) van beleggingen — nieuw in België vanaf 2026.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
          <p className="font-semibold text-green-800 text-sm">✅ ETF-meerwaarden (particulieren)</p>
          <p className="text-sm text-gray-700">
            <strong>Momenteel GEEN belasting</strong> op meerwaarden van gewone ETFs voor
            particulieren. Je verkoopt je ETF-positie met winst? Die winst is belastingvrij.
          </p>
          <p className="text-xs text-gray-500">
            Dit kan wijzigen bij toekomstige wetgeving — houd het nieuws in de gaten.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="font-semibold text-amber-800 text-sm">⚠️ Meerwaardebelasting 2026 (10%)</p>
          <p className="text-sm text-gray-700">
            Nieuw regeerakkoord 2026: <strong>10% op meerwaarden boven €1.000.000</strong>.
            Van toepassing op termijncontracten, opties en crypto.{" "}
            <strong>NIET</strong> op gewone ETF-meerwaarden voor particulieren.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <p className="font-semibold text-gray-800 text-sm">📋 Overzicht — wat valt wel/niet onder meerwaardebelasting?</p>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-medium text-red-700 mb-1">❌ WEL belast (10% boven €1M)</p>
            <ul className="list-disc list-inside text-gray-600 space-y-0.5">
              <li>Termijncontracten (futures)</li>
              <li>Opties en warrants</li>
              <li>Cryptocurrency</li>
              <li>Speculatieve kortetermijntransacties</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-green-700 mb-1">✅ NIET belast (voorlopig)</p>
            <ul className="list-disc list-inside text-gray-600 space-y-0.5">
              <li>Gewone ETF-meerwaarden (particulieren)</li>
              <li>Aandelen langetermijn</li>
              <li>Obligaties meerwaarden</li>
              <li>Pensioensparen bij uitkering (apart stelsel)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
        <strong>⚠️ Disclaimer:</strong> Fiscale regelgeving kan wijzigen. Raadpleeg een erkende
        belastingadviseur of fiscalist voor jouw persoonlijke situatie. Deze informatie is
        educatief van aard en geen fiscaal advies.
      </div>
    </div>
  );
}

// ─── Sectie 3: Dividendbelasting (Roerende voorheffing) ──────────────────────

function Dividendbelasting() {
  const [dividend, setDividend] = useState<string>("1000");

  const dividendNum = parseFloat(dividend.replace(",", ".")) || 0;
  const rv = dividendNum * 0.3;
  const nettoDiv = dividendNum - rv;

  return (
    <div className="card space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">💸 Roerende voorheffing (RV)</h2>
        <p className="text-sm text-gray-500 mt-1">
          Belasting op dividenden — van toepassing bij uitkerende ETFs en aandelen.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
          <p className="font-semibold text-orange-800 text-sm">📤 Uitkerend ETF</p>
          <p className="text-sm text-gray-700">
            Dividend wordt uitbetaald aan de belegger.{" "}
            <strong>30% roerende voorheffing</strong> wordt automatisch ingehouden door de
            broker. Je ontvangt netto 70% van het brutodividend.
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
          <p className="font-semibold text-green-800 text-sm">📊 Accumulerend ETF</p>
          <p className="text-sm text-gray-700">
            Dividend wordt <strong>automatisch herbelegd</strong> in het fonds.{" "}
            <strong>Geen RV</strong> — de volledige opbrengst groeit mee. In België fiscaal
            gunstiger voor langetermijnbeleggers.
          </p>
        </div>
      </div>

      {/* Simulator */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">🔢 Dividend simulator</h3>
        <div className="max-w-xs space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Bruto dividend (€)</label>
          <input
            type="number"
            min={0}
            step={50}
            value={dividend}
            onChange={(e) => setDividend(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            placeholder="bv. 1000"
          />
        </div>

        {dividendNum > 0 && (
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Bruto dividend</p>
              <p className="text-lg font-bold text-gray-800">{fmt(dividendNum)}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">RV (30%)</p>
              <p className="text-lg font-bold text-red-700">− {fmt(rv)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Netto ontvangen</p>
              <p className="text-lg font-bold text-green-700">{fmt(nettoDiv)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <strong>💡 Waarom kiezen Belgische beleggers vaak voor accumulerende ETFs?</strong>
        <ul className="list-disc list-inside mt-1 space-y-0.5">
          <li>Geen 30% RV op dividenden — de volledige opbrengst blijft renderen</li>
          <li>Rente-op-rente effect: ook de uitgespaarde belasting groeit mee</li>
          <li>Minder administratie: geen dividendaangiften te verwerken</li>
          <li>
            Voorbeeld: VWCE (accumulerend) vs VWRL (uitkerend) — zelfde index, andere fiscale
            behandeling
          </li>
        </ul>
      </div>
    </div>
  );
}

// ─── Sectie 4: Pensioensparen vergelijker ─────────────────────────────────────

const PENSIOEN_MAX = 1020; // Max aftrekbaar bedrag 2024
const PENSIOEN_TAX_BENEFIT = 0.30; // 30% belastingvermindering
const PENSIOEN_GROWTH = 0.035; // Typisch pensioensparen fonds ~3,5%/jaar
const ETF_GROWTH = 0.07; // Historisch ~7%/jaar (bruto)
const PENSIOEN_EXIT_TAX = 0.08; // 8% eindbelasting op 60e verjaardag
const PENSIOEN_YEARS = 30;

function PensioenVergelijker() {
  const chartData = useMemo<PensioengrafiekDataPoint[]>(() => {
    const data: PensioengrafiekDataPoint[] = [];
    let pensioen = 0;
    let etf = 0;
    const netPensioenContributie = PENSIOEN_MAX * (1 - PENSIOEN_TAX_BENEFIT); // €714 netto/jaar

    for (let y = 0; y <= PENSIOEN_YEARS; y++) {
      if (y > 0) {
        pensioen = (pensioen + PENSIOEN_MAX) * (1 + PENSIOEN_GROWTH);
        etf = (etf + PENSIOEN_MAX) * (1 + ETF_GROWTH);
      }
      data.push({
        jaar: y,
        pensioensparen: Math.round(y === PENSIOEN_YEARS ? pensioen * (1 - PENSIOEN_EXIT_TAX) : pensioen),
        etf: Math.round(etf),
      });
    }
    // Annotatie: netto effectief: pensioensparen met tax-benefit meerekenen
    // We tonen ook de "echte netto kost"-lijn voor pensioensparen
    // Netto kost = €714/jaar ipv €1020 — maar eindwaarde is hetzelfde
    // Berekend op basis van nettobedrag per jaar:
    const dataMetNetto: PensioengrafiekDataPoint[] = [];
    let pensioenNetto = 0;
    let etfFull = 0;
    for (let y = 0; y <= PENSIOEN_YEARS; y++) {
      if (y > 0) {
        pensioenNetto = (pensioenNetto + netPensioenContributie) * (1 + PENSIOEN_GROWTH);
        etfFull = (etfFull + PENSIOEN_MAX) * (1 + ETF_GROWTH);
      }
      dataMetNetto.push({
        jaar: y,
        pensioensparen: Math.round(
          y === PENSIOEN_YEARS ? pensioenNetto * (1 - PENSIOEN_EXIT_TAX) : pensioenNetto
        ),
        etf: Math.round(etfFull),
      });
    }
    return dataMetNetto;
  }, []);

  const eindPensioen = chartData[PENSIOEN_YEARS]?.pensioensparen ?? 0;
  const eindEtf = chartData[PENSIOEN_YEARS]?.etf ?? 0;
  const totalTaxBenefit = PENSIOEN_YEARS * PENSIOEN_MAX * PENSIOEN_TAX_BENEFIT;

  return (
    <div className="card space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">🏦 Pensioensparen vs ETF</h2>
        <p className="text-sm text-gray-500 mt-1">
          Vergelijking over 30 jaar: jaarlijks €{PENSIOEN_MAX.toLocaleString("nl-BE")} inleggen
          via pensioensparen of een brede ETF.
        </p>
      </div>

      {/* Aannames */}
      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1.5">
          <p className="font-semibold text-blue-800">🏛️ Pensioensparen (simulatie)</p>
          <ul className="text-gray-600 space-y-0.5 list-disc list-inside">
            <li>Inleg: €{PENSIOEN_MAX}/jaar (max aftrekbaar)</li>
            <li>
              Belastingvoordeel: 30% = <strong>{fmt(PENSIOEN_MAX * 0.3, 0)} terug/jaar</strong>
            </li>
            <li>Netto kost: {fmt(PENSIOEN_MAX * 0.7, 0)}/jaar</li>
            <li>Groei: ~3,5%/jaar (typisch fonds)</li>
            <li>Eindbelasting op 60e verjaardag: 8%</li>
            <li>
              Totaal belastingvoordeel over 30 jaar:{" "}
              <strong>{fmtCompact(totalTaxBenefit)}</strong>
            </li>
          </ul>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1.5">
          <p className="font-semibold text-green-800">📈 ETF (VWCE — simulatie)</p>
          <ul className="text-gray-600 space-y-0.5 list-disc list-inside">
            <li>Inleg: €{PENSIOEN_MAX}/jaar</li>
            <li>Geen belastingvoordeel op inleg</li>
            <li>Groei: ~7%/jaar (historisch VWCE)</li>
            <li>Geen eindbelasting op meerwaarden</li>
            <li>TOB: 0,35% per transactie</li>
            <li>Volledig liquide (opneembaar op elk moment)</li>
          </ul>
        </div>
      </div>

      {/* Grafiek */}
      <ResponsiveContainer width="100%" height={300}>
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
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="etf"
            name="ETF (VWCE ~7%)"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="pensioensparen"
            name="Pensioensparen (netto, na 8% eindtaks)"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Eindwaardes */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">ETF eindwaarde (30j)</p>
          <p className="text-xl font-bold text-green-700">{fmtCompact(eindEtf)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Pensioensparen eindwaarde (netto)</p>
          <p className="text-xl font-bold text-blue-700">{fmtCompact(eindPensioen)}</p>
        </div>
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">ETF-voordeel na 30j</p>
          <p className="text-xl font-bold text-primary-600">
            +{fmtCompact(eindEtf - eindPensioen)}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 space-y-2">
        <p className="font-semibold">💡 Conclusie</p>
        <p>
          <strong>Pensioensparen</strong> is interessant voor wie zekerheid zoekt: gegarandeerde
          terugkeer van 30% via belastingvermindering, lager risico, maar ook lager verwacht
          rendement (~3,5%/jaar) en minder liquiditeit.
        </p>
        <p>
          <strong>ETF's</strong> bieden historisch hoger rendement (~7%/jaar) en volledige
          liquiditeit, maar zonder belastingvoordeel op inleg en met meer volatiliteit.
        </p>
        <p className="text-xs text-gray-500">
          Combinatie mogelijk: pensioensparen voor het belastingvoordeel (max €1.020/jaar) én
          ETF's voor het overige spaargeld.
        </p>
      </div>
    </div>
  );
}

// ─── Pagina ───────────────────────────────────────────────────────────────────

export default function BelastingPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🏦 Belgisch fiscaal dashboard</h1>
        <p className="text-gray-500 mt-2">
          Alles over Belgische belastingen op ETFs — duidelijk uitgelegd voor beginners.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
        <strong>⚠️ Educatieve informatie</strong> — Dit dashboard geeft geen fiscaal of
        financieel advies. Belastingregels kunnen wijzigen. Raadpleeg een erkende fiscalist of
        belastingadviseur voor jouw persoonlijke situatie.
      </div>

      {/* Sectie 1: TOB */}
      <TobCalculator />

      {/* Sectie 2: Meerwaardebelasting */}
      <Meerwaardebelasting />

      {/* Sectie 3: Roerende voorheffing */}
      <Dividendbelasting />

      {/* Sectie 4: Pensioensparen */}
      <PensioenVergelijker />

      {/* Feature 2: Staatsbon vergelijker */}
      <StaatsbonVergelijker />
    </div>
  );
}
