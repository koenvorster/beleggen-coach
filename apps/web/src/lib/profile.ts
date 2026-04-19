export interface UserProfile {
  goal: "pensioen" | "huis" | "studie" | "vermogen";
  monthly: number;
  years: number;
  risk: "rustig" | "licht" | "accepteer";
  createdAt: string;
}

const STORAGE_KEY = "beleggen_profile";

export function saveProfile(p: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getSuggestedETF(risk: UserProfile["risk"]): string {
  if (risk === "rustig") return "AGGH";
  if (risk === "licht") return "VWCE";
  return "IWDA";
}

export function calcProjectedValue(
  monthly: number,
  years: number,
  annualRate: number
): number {
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r);
}

export function goalLabel(goal: UserProfile["goal"]): string {
  const map: Record<UserProfile["goal"], string> = {
    pensioen: "Pensioen opbouwen",
    huis: "Huis kopen",
    studie: "Studie van mijn kind",
    vermogen: "Vermogen opbouwen",
  };
  return map[goal];
}

export function riskLabel(risk: UserProfile["risk"]): string {
  const map: Record<UserProfile["risk"], string> = {
    rustig: "Rustig slapen",
    licht: "Licht ongemak",
    accepteer: "Ik accepteer grote schommelingen",
  };
  return map[risk];
}
