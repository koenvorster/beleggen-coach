"use client";

import { useState, useEffect, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  xp: number;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "first-invest", title: "Eerste stap", desc: "Je eerste investering gemaakt", icon: "🌱", xp: 100 },
  { id: "one-month", title: "Beginner", desc: "1 maand geïnvesteerd", icon: "📅", xp: 200 },
  { id: "three-months", title: "Gewoonte", desc: "3 maanden op rij", icon: "🔥", xp: 500 },
  { id: "six-months", title: "Consequent", desc: "6 maanden op rij", icon: "⚡", xp: 1000 },
  { id: "one-year", title: "Volhouder", desc: "12 maanden op rij", icon: "🏆", xp: 2000 },
  { id: "thousand-euro", title: "€1.000 bereikt", desc: "Eerste duizend euro gespaard", icon: "💰", xp: 500 },
  { id: "ten-thousand", title: "€10.000 bereikt", desc: "Tienduizend euro gespaard", icon: "💎", xp: 2000 },
  { id: "diversified", title: "Gespreid", desc: "3 of meer ETFs in portfolio", icon: "🌍", xp: 300 },
  { id: "learned-all", title: "Kenner", desc: "Alle lessen voltooid", icon: "🎓", xp: 1000 },
];

const LEVELS = [
  { min: 0, max: 500, label: "Starter" },
  { min: 500, max: 1500, label: "Beginner" },
  { min: 1500, max: 4000, label: "Gevorderde" },
  { min: 4000, max: 10000, label: "Expert" },
  { min: 10000, max: Infinity, label: "Master" },
];

const LS_STREAK = "beleggingcoach-streak-months";
const LS_ACHIEVEMENTS = "beleggingcoach-achievements";
const LS_INVESTED = "beleggingcoach-total-invested";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStreak(months: string[]): number {
  if (months.length === 0) return 0;
  const sorted = [...months].sort().reverse();
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const [y1, m1] = sorted[i - 1].split("-").map(Number);
    const [y2, m2] = sorted[i].split("-").map(Number);
    const diff = (y1 * 12 + m1) - (y2 * 12 + m2);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PrestatiesPage() {
  const [months, setMonths] = useState<string[]>([]);
  const [earnedIds, setEarnedIds] = useState<string[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);

  useEffect(() => {
    const m: string[] = JSON.parse(localStorage.getItem(LS_STREAK) ?? "[]");
    const a: string[] = JSON.parse(localStorage.getItem(LS_ACHIEVEMENTS) ?? "[]");
    const t = parseFloat(localStorage.getItem(LS_INVESTED) ?? "0");
    setMonths(m);
    setEarnedIds(a);
    setTotalInvested(t);
  }, []);

  const currentStreak = useMemo(() => getStreak(months), [months]);
  const bestStreak = useMemo(() => {
    // compute best streak from full list
    if (months.length === 0) return 0;
    const sorted = [...months].sort();
    let best = 1, cur = 1;
    for (let i = 1; i < sorted.length; i++) {
      const [y1, m1] = sorted[i - 1].split("-").map(Number);
      const [y2, m2] = sorted[i].split("-").map(Number);
      if ((y2 * 12 + m2) - (y1 * 12 + m1) === 1) { cur++; best = Math.max(best, cur); }
      else cur = 1;
    }
    return best;
  }, [months]);

  const totalXP = useMemo(
    () => ACHIEVEMENTS.filter((a) => earnedIds.includes(a.id)).reduce((s, a) => s + a.xp, 0),
    [earnedIds]
  );

  const currentLevel = LEVELS.find((l) => totalXP >= l.min && totalXP < l.max) ?? LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const levelProgress = nextLevel
    ? ((totalXP - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
    : 100;

  // last 12 months for calendar
  const last12 = useMemo(() => {
    const result: { key: string; label: string; active: boolean }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      result.push({ key, label: d.toLocaleString("nl-BE", { month: "short" }), active: months.includes(key) });
    }
    return result;
  }, [months]);

  function simulateDemo() {
    const newMonths: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      newMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const demoAchievements = ["first-invest", "one-month", "three-months"];
    localStorage.setItem(LS_STREAK, JSON.stringify(newMonths));
    localStorage.setItem(LS_ACHIEVEMENTS, JSON.stringify(demoAchievements));
    localStorage.setItem(LS_INVESTED, "1800");
    setMonths(newMonths);
    setEarnedIds(demoAchievements);
    setTotalInvested(1800);
  }

  function resetAll() {
    localStorage.removeItem(LS_STREAK);
    localStorage.removeItem(LS_ACHIEVEMENTS);
    localStorage.removeItem(LS_INVESTED);
    setMonths([]);
    setEarnedIds([]);
    setTotalInvested(0);
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🏆 Mijn Prestaties</h1>
        <p className="text-gray-500 mt-1">Volg je voortgang en verdien badges</p>
      </div>

      {/* Streak */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">🔥 DCA Streak</h2>
          <span className="text-3xl font-black text-orange-500">{currentStreak}</span>
        </div>
        <p className="text-sm text-gray-500">
          Huidige streak: <strong>{currentStreak} maand{currentStreak !== 1 ? "en" : ""}</strong> op rij ·
          Beste ooit: <strong>{bestStreak} maanden</strong>
        </p>
        <div className="grid grid-cols-12 gap-1">
          {last12.map((m) => (
            <div
              key={m.key}
              title={m.key}
              className={`h-7 rounded flex items-center justify-center text-xs font-medium ${
                m.active ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
              }`}
            >
              {m.label.slice(0, 1)}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">Groen = maand geïnvesteerd</p>
      </div>

      {/* Level & XP */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">⚡ Level & XP</h2>
          <span className="text-sm font-semibold text-indigo-600">{totalXP} XP</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-indigo-600">Level {LEVELS.indexOf(currentLevel) + 1}</span>
          <span className="text-gray-500 font-medium">{currentLevel.label}</span>
        </div>
        {nextLevel && (
          <div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Nog {nextLevel.min - totalXP} XP voor {nextLevel.label}
            </p>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">🎖️ Badges</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const earned = earnedIds.includes(a.id);
            return (
              <div
                key={a.id}
                title={a.desc}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
                  earned
                    ? "bg-indigo-50 border-indigo-200 shadow-sm shadow-indigo-100"
                    : "opacity-30 grayscale bg-gray-50 border-gray-200"
                }`}
              >
                <span className="text-3xl">{a.icon}</span>
                <span className="text-xs font-semibold text-gray-700 leading-tight">{a.title}</span>
                <span className="text-xs text-indigo-500 font-medium">{a.xp} XP</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-bold text-indigo-900">📊 Belgische BeleggenCoach gebruikers</h2>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {[
            { label: "Gemiddeld maandelijks spaarbedrag", value: "€287" },
            { label: "Gemiddelde DCA-streak", value: "4 maanden" },
            { label: "Populairste ETF", value: "VWCE (67%)" },
            { label: "Kiest duurzame ETFs", value: "57% van beleggers" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-3 border border-indigo-100">
              <p className="text-gray-500 text-xs">{s.label}</p>
              <p className="font-bold text-indigo-700 text-lg">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Demo controls */}
      <div className="flex gap-3">
        <button
          onClick={simulateDemo}
          className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          🎮 Simuleer 6 maanden DCA
        </button>
        <button
          onClick={resetAll}
          className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
