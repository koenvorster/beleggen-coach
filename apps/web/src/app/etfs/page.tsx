import { Suspense } from "react";
import { api, type BackendETF } from "@/lib/api";
import { MOCK_ETFS, type MockETF } from "@/lib/mock-etfs";
import ETFListClient from "./ETFListClient";

function mockToBackendETF(mock: MockETF): BackendETF {
  return {
    isin: mock.isin,
    ticker: mock.ticker,
    naam: mock.name,
    categorie: mock.category,
    regio: "Wereld",
    expense_ratio: mock.ter,
    aum_miljard_eur: 0,
    accumulating: mock.accumulating,
    volatility_3y: 0,
    beginner_score: mock.beginnerScore,
    description: mock.description,
  };
}

function ETFSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card space-y-3 animate-pulse" aria-hidden="true">
          <div className="flex gap-3">
            <div className="h-5 bg-gray-200 rounded w-16" />
            <div className="h-5 bg-gray-100 rounded w-24" />
          </div>
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-2 bg-gray-100 rounded-full w-full" />
          <div className="flex justify-between">
            <div className="h-4 bg-gray-100 rounded w-24" />
            <div className="h-6 bg-gray-100 rounded-full w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function ETFsSection({
  categorie,
  max_ter,
}: {
  categorie?: string;
  max_ter?: number;
}) {
  let etfs: BackendETF[];
  let usingMock = false;

  try {
    etfs = await api.etfs.list({ categorie, max_ter });
  } catch {
    usingMock = true;
    let mocks = MOCK_ETFS.map(mockToBackendETF);
    if (categorie) mocks = mocks.filter((e) => e.categorie === categorie);
    if (max_ter !== undefined) mocks = mocks.filter((e) => e.expense_ratio <= max_ter);
    etfs = mocks;
  }

  return (
    <div className="space-y-6">
      {usingMock && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          ⚠️ Tijdelijk worden voorbeelddata getoond — backend niet bereikbaar
        </div>
      )}
      <ETFListClient
        etfs={etfs}
        activeCategoryParam={categorie ?? ""}
        maxTerParam={max_ter !== undefined ? String(max_ter) : ""}
      />
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{ categorie?: string; max_ter?: string }>;
}

export default async function ETFsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const categorie = params.categorie;
  const max_ter = params.max_ter ? parseFloat(params.max_ter) : undefined;

  return (
    <div className="space-y-8 pb-24">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">ETF&apos;s verkennen</h1>
        <p className="text-gray-500">
          Ontdek fondsen die mogelijk bij jouw situatie passen. Geen aanbeveling — gebruik dit als
          startpunt voor je eigen onderzoek.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
        <p><strong>⚠️ Educatief platform — geen financieel advies</strong></p>
        <p>
          De informatie op deze pagina is uitsluitend bedoeld ter educatie en vergelijking.
          BeleggenCoach is geen vergunde beleggingsadviseur (MiFID II) en geeft geen persoonlijk
          beleggingsadvies. ETF-scores zijn indicatief en gebaseerd op publieke data.
          Raadpleeg een erkend financieel adviseur (FSMA-vergund) voor persoonlijk advies.
        </p>
      </div>

      <Suspense fallback={<ETFSkeleton />}>
        <ETFsSection categorie={categorie} max_ter={max_ter} />
      </Suspense>
    </div>
  );
}
