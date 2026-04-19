// ─── User ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  naam: string;
  taal: "nl" | "fr" | "en";
  createdAt: string;
}

// ─── Investor Profile ───────────────────────────────────────────────────────

export type GoalType =
  | "pensioen"
  | "huis_kopen"
  | "studie_kind"
  | "noodfonds"
  | "vermogen_opbouwen"
  | "anders";

export type RiskTolerance = "laag" | "matig" | "hoog";
export type ExperienceLevel = "geen" | "basis" | "gevorderd";

export interface InvestorProfile {
  id: string;
  userId: string;
  goalType: GoalType;
  goalDescription?: string;
  horizonYears: number;           // 1–40
  monthlyBudget: number;          // EUR
  emergencyFundReady: boolean;
  riskTolerance: RiskTolerance;
  experienceLevel: ExperienceLevel;
  createdAt: string;
  updatedAt: string;
}

// ─── ETF ────────────────────────────────────────────────────────────────────

export type AssetClass = "aandelen" | "obligaties" | "gemengd" | "grondstoffen" | "vastgoed";
export type DistributionType = "accumulating" | "distributing";
export type ReplicationMethod = "fysiek" | "synthetisch" | "gesampled";

export interface ETF {
  isin: string;
  ticker: string;
  name: string;
  issuer: string;
  expenseRatio: number;           // bijv. 0.07 = 0.07%
  domicile: string;               // bijv. "IE", "LU"
  assetClass: AssetClass;
  regionFocus: string;            // bijv. "World", "Europe", "USA"
  distributionType: DistributionType;
  replicationMethod: ReplicationMethod;
  fundSizeMillionEur: number;
  currency: string;               // bijv. "EUR", "USD"
  indexTracked?: string;          // bijv. "MSCI World"
}

export interface ETFMetrics {
  etfIsin: string;
  return1y?: number;              // % bijv. 12.5
  return3y?: number;
  return5y?: number;
  volatility3y?: number;          // % annualized
  maxDrawdown?: number;           // % negatief getal
  updatedAt: string;
}

// ─── Scores ─────────────────────────────────────────────────────────────────

export interface ETFScore {
  etfIsin: string;
  beginnerFit: number;            // 0–100
  beginnerFitExplanation: string;
  disciplineFit: number;          // 0–100
  disciplineFitExplanation: string;
  riskFit: number;                // 0–100
  riskFitExplanation: string;
  overallFit: number;             // gewogen gemiddelde
}

// ─── Plan ────────────────────────────────────────────────────────────────────

export interface AllocationItem {
  etfIsin: string;
  percentage: number;             // 0–100, som = 100
  rationale: string;
}

export interface Plan {
  id: string;
  userId: string;
  monthlyAmount: number;          // EUR
  allocation: AllocationItem[];
  rationale: string;
  riskNotes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Simulatie ───────────────────────────────────────────────────────────────

export interface SimulationDataPoint {
  year: number;
  pessimistic: number;            // EUR (bijv. 3% rendement)
  realistic: number;              // EUR (bijv. 6% rendement)
  optimistic: number;             // EUR (bijv. 9% rendement)
  totalInvested: number;          // EUR (enkel inleg, geen rendement)
}

export interface SimulationResult {
  monthlyAmount: number;
  horizonYears: number;
  dataPoints: SimulationDataPoint[];
  disclaimer: string;
}

// ─── Check-in ────────────────────────────────────────────────────────────────

export type EmotionalState = "rustig" | "onzeker" | "bezorgd" | "enthousiast" | "gestresst";

export interface CheckIn {
  id: string;
  userId: string;
  month: string;                  // bijv. "2026-04"
  invested: boolean;
  emotionalState: EmotionalState;
  notes?: string;
  coachResponse?: string;
  createdAt: string;
}

// ─── MCP tool response wrapper ───────────────────────────────────────────────

export interface MCPSuccess<T> {
  success: true;
  data: T;
  error: null;
}

export interface MCPError {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
  };
}

export type MCPResponse<T> = MCPSuccess<T> | MCPError;
