// ─── Analytics interfaces ─────────────────────────────────────────────────────

export interface ETFMetric {
  ticker: string;
  naam: string;
  return_1m: number | null;
  return_3m: number | null;
  return_ytd: number | null;
  return_1y: number | null;
  return_3y: number | null;
  return_5y: number | null;
  volatility_1y: number | null;
  sharpe_1y: number | null;
  max_drawdown: number | null;
  last_price: number | null;
}

export interface PlatformStats {
  populairste_etf: string;
  gem_maandelijks_bedrag: number;
  gem_streak_maanden: number;
  pct_duurzaam: number;
  totaal_gebruikers: number;
  etfs_gevolgd: number;
}

// ─── Analytics interfaces ─────────────────────────────────────────────────────

export interface ETFMetric {
  ticker: string;
  naam: string;
  ter?: number | null;
  return_1m: number | null;
  return_3m: number | null;
  return_ytd: number | null;
  return_1y: number | null;
  return_3y: number | null;
  return_5y: number | null;
  volatility_1y: number | null;
  sharpe_1y: number | null;
  max_drawdown: number | null;
  last_price: number | null;
}

// ─── Marktdata interfaces ─────────────────────────────────────────────────────

export interface MarktIndex {
  ticker: string;
  naam: string;
  huidige_koers: number;
  wijziging_pct: number;
  wijziging_eur: number;
  valuta: string;
}

export interface KoersDataPunt {
  datum: string;
  koers: number;
}

// ─── Backend datamodel ────────────────────────────────────────────────────────

/** ETF zoals de FastAPI backend hem teruggeeft. */
export interface BackendETF {
  isin: string;
  ticker: string;
  naam: string;
  categorie: string;
  regio: string;
  expense_ratio: number;
  aum_miljard_eur: number;
  accumulating: boolean;
  volatility_3y: number;
  beginner_score: number;
  description: string;
}

/** Standaard omhullende response van de backend. */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

// ─── Domein-interfaces ────────────────────────────────────────────────────────

export interface PlanCreate {
  etf_isin: string;
  etf_ticker: string;
  monthly_amount: number;
  years: number;
  goal: string;
  risk_profile: string;
}

export interface Plan {
  id: string;
  user_id: string;
  etf_isin: string;
  etf_ticker: string;
  monthly_amount: number;
  years: number;
  goal: string;
  risk_profile: string;
  created_at: string;
}

export interface CheckInCreate {
  month: string;           // bv. "2025-06"
  invested: number;
  emotional_state: string;
  notes?: string;
}

export interface CheckIn extends CheckInCreate {
  id: string;
  user_id: string;
  created_at: string;
}

export interface PortfolioPositionCreate {
  etf_isin: string;
  etf_ticker: string;
  shares: number;
  buy_price_eur: number;
  buy_date: string;        // ISO-datum: "2025-01-15"
  notes?: string;
}

export interface PortfolioPosition extends PortfolioPositionCreate {
  id: string;
  user_id: string;
}

export interface Risicoscan {
  score: number;
  score_label: string;
  ter_gewogen: number;
  geografisch: Record<string, number>;
  aanbevelingen: string[];
  risico_niveau: "laag" | "medium" | "hoog";
}

export interface OnboardingProfile {
  goal: string;
  monthly: number;
  years: number;
  risk: string;
}

// ─── Legacy interfaces (achterwaartse compatibiliteit) ────────────────────────

/** @deprecated Gebruik BackendETF. Aanwezig voor migratie-periode. */
export interface ETF {
  ticker: string;
  name: string;
  ter: number;
  beginnerScore: number;
  category: string;
  description: string;
  accumulating: boolean;
}

/** @deprecated Gebruik PlanCreate. */
export interface OnboardingPayload {
  goal: string;
  monthly: number;
  years: number;
  risk: string;
}

/** @deprecated Vervangen door Plan. */
export interface PlanResponse {
  etf: ETF;
  projectedValue: number;
  monthlySuggested: number;
}

// ─── Mapping-hulpfunctie ──────────────────────────────────────────────────────

/**
 * Zet een BackendETF om naar de props die ETFCard verwacht.
 * Centraal geplaatst zodat naamveranderingen in de backend één plek hebben.
 */
export function toETFCardProps(etf: BackendETF) {
  return {
    isin: etf.isin,
    ticker: etf.ticker,
    name: etf.naam,
    ter: etf.expense_ratio,
    beginnerScore: etf.beginner_score,
    category: etf.categorie,
    description: etf.description,
    accumulating: etf.accumulating,
  };
}

// ─── HTTP-kern ────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}/api/v1${path}`;
  let res: Response;

  try {
    res = await fetch(url, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error(
      "Backend niet bereikbaar — controleer of de server draait op " + BASE_URL
    );
  }

  if (!res.ok) {
    let boodschap = `API-fout ${res.status}: ${res.statusText}`;
    try {
      const body = (await res.json()) as ApiResponse<unknown>;
      if (body.error?.message) boodschap = body.error.message;
    } catch {
      // ignore parse-fouten
    }
    throw new Error(boodschap);
  }

  return res.json() as Promise<T>;
}

// ─── API-client ───────────────────────────────────────────────────────────────

export const api = {
  /** Marktdata eindpunten */
  market: {
    /** Haal actuele koersen op voor bekende indices en ETFs. */
    indices: (): Promise<MarktIndex[]> =>
      apiFetch<MarktIndex[]>("/market/indices"),

    /** Haal koershistorie op voor een ticker. */
    history: (ticker: string, periode = "1y"): Promise<KoersDataPunt[]> =>
      apiFetch<{ success: boolean; data: KoersDataPunt[]; error: null }>(
        `/market/history/${encodeURIComponent(ticker)}?periode=${periode}`
      ).then((r) => r.data ?? []),
  },

  /** ETF-eindpunten */
  etfs: {
    /** Haal lijst op. Alle parameters zijn optioneel. */
    list: (params?: {
      categorie?: string;
      regio?: string;
      max_ter?: number;
      limit?: number;
    }): Promise<BackendETF[]> => {
      const qs = new URLSearchParams();
      if (params?.categorie) qs.set("categorie", params.categorie);
      if (params?.regio) qs.set("regio", params.regio);
      if (params?.max_ter !== undefined) qs.set("max_ter", String(params.max_ter));
      if (params?.limit !== undefined) qs.set("limit", String(params.limit));
      const query = qs.toString() ? `?${qs.toString()}` : "";
      return apiFetch<ApiResponse<{ count: number; etfs: BackendETF[] }>>(
        `/etfs${query}`
      ).then((r) => r.data?.etfs ?? []);
    },

    /** Haal één ETF op via ISIN. */
    get: (isin: string): Promise<BackendETF> =>
      apiFetch<ApiResponse<BackendETF>>(`/etfs/${isin}`).then((r) => {
        if (!r.data) throw new Error(`ETF ${isin} niet gevonden`);
        return r.data;
      }),
  },

  /** Onboarding-eindpunten */
  onboarding: {
    /** Start een nieuwe onboarding-sessie. Geeft session_id terug. */
    start: (): Promise<{ session_id: string }> =>
      apiFetch<ApiResponse<{ session_id: string }>>("/onboarding/start", {
        method: "POST",
      }).then((r) => {
        if (!r.data) throw new Error("Sessie starten mislukt");
        return r.data;
      }),

    /** Sla profiel op voor een sessie. */
    saveProfile: (
      sessionId: string,
      profile: OnboardingProfile
    ): Promise<void> =>
      apiFetch<ApiResponse<null>>(
        `/onboarding/${sessionId}/profile`,
        { method: "PUT", body: JSON.stringify(profile) }
      ).then(() => undefined),
  },

  /** Plan-eindpunten */
  plans: {
    create: (userId: string, plan: PlanCreate): Promise<Plan> =>
      apiFetch<Plan>(`/users/${userId}/plans`, {
        method: "POST",
        body: JSON.stringify(plan),
      }),

    list: (userId: string): Promise<Plan[]> =>
      apiFetch<Plan[]>(`/users/${userId}/plans`).then(
        (r) => Array.isArray(r) ? r : []
      ),

    get: (userId: string, planId: string): Promise<Plan> =>
      apiFetch<Plan>(`/users/${userId}/plans/${planId}`),
  },

  /** Check-in eindpunten */
  checkins: {
    create: (userId: string, checkin: CheckInCreate): Promise<CheckIn> =>
      apiFetch<CheckIn>(`/users/${userId}/checkins`, {
        method: "POST",
        body: JSON.stringify(checkin),
      }),

    list: (userId: string): Promise<CheckIn[]> =>
      apiFetch<CheckIn[]>(`/users/${userId}/checkins`).then(
        (r) => Array.isArray(r) ? r : []
      ),
  },

  /** Chat memory eindpunten (directe backend calls) */
  chat: {
    getHistory: (userId: string) =>
      apiFetch<{ success: boolean; data: { user_id: string; messages: unknown[]; count: number } | null; error: { code: string; message: string } | null }>(
        `/chat/${userId}/history`
      ),
    clearHistory: (userId: string) =>
      apiFetch<void>(`/chat/${userId}/history`, { method: "DELETE" }),
  },

  /** Analytics-eindpunten */
  analytics: {
    /** Haal ETF performance metrics op voor alle gevolgde ETFs. */
    etfMetrics: (): Promise<ETFMetric[]> =>
      apiFetch<ApiResponse<ETFMetric[]>>("/analytics/etf-metrics").then(
        (r) => r.data ?? []
      ),

    /** Haal koershistorie op voor een ETF-ticker. */
    etfHistory: (ticker: string, periode = "1y"): Promise<KoersDataPunt[]> =>
      apiFetch<ApiResponse<KoersDataPunt[]>>(
        `/analytics/etf-history/${encodeURIComponent(ticker)}?periode=${periode}`
      ).then((r) => r.data ?? []),
  },

  /** Portfolio-eindpunten */
  portfolio: {get: (userId: string): Promise<PortfolioPosition[]> =>
      apiFetch<PortfolioPosition[]>(
        `/users/${userId}/positions`
      ).then((r) => Array.isArray(r) ? r : []),

    add: (
      userId: string,
      position: PortfolioPositionCreate
    ): Promise<PortfolioPosition> =>
      apiFetch<PortfolioPosition>(
        `/users/${userId}/positions`,
        { method: "POST", body: JSON.stringify(position) }
      ).then((r) => {
        if (!r) throw new Error("Positie toevoegen mislukt");
        return r;
      }),

    remove: (userId: string, positionId: string): Promise<void> =>
      apiFetch<null>(
        `/users/${userId}/positions/${positionId}`,
        { method: "DELETE" }
      ).then(() => undefined),

    risicoscan: (userId: string): Promise<Risicoscan> =>
      apiFetch<Risicoscan>(`/users/${userId}/portfolio/risicoscan`),
  },

  /** Analytics eindpunten */
  analytics: {
    /** Berekende performance metrics voor alle ETFs. */
    getETFMetrics: (): Promise<ETFMetric[]> =>
      apiFetch<{ success: boolean; data: ETFMetric[]; error: null }>(
        "/analytics/etf-metrics"
      ).then((r) => r.data ?? []),

    /** Historische dagelijkse prijzen voor een specifieke ETF. */
    getETFHistory: (
      ticker: string,
      periode = "1y"
    ): Promise<{ datum: string; koers: number }[]> =>
      apiFetch<{ success: boolean; data: { datum: string; koers: number }[]; error: null }>(
        `/analytics/etf-history/${encodeURIComponent(ticker)}?periode=${periode}`
      ).then((r) => r.data ?? []),

    /** Anonieme platform statistieken. */
    getPlatformStats: (): Promise<PlatformStats> =>
      apiFetch<{ success: boolean; data: PlatformStats; error: null }>(
        "/analytics/platform-stats"
      ).then((r) => {
        if (!r.data) throw new Error("Platform stats niet beschikbaar");
        return r.data;
      }),
  },
};
