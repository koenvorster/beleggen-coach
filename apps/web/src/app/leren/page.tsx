"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ────────────────────────────────────────────────────────────────────────────
// Types & persistence
// ────────────────────────────────────────────────────────────────────────────

interface LerenProgress {
  openedLessons: boolean[];
  quizDone: boolean;
}

const STORAGE_KEY = "lerenProgress";
const DEFAULT_PROGRESS: LerenProgress = {
  openedLessons: [false, false, false, false, false],
  quizDone: false,
};

function loadProgress(): LerenProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    return JSON.parse(raw) as LerenProgress;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function saveProgress(p: LerenProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

// ────────────────────────────────────────────────────────────────────────────
// Voortgangsindicator
// ────────────────────────────────────────────────────────────────────────────

interface ProgressBarProps {
  progress: LerenProgress;
}

function ProgressBar({ progress }: ProgressBarProps) {
  const completedLessons = progress.openedLessons.filter(Boolean).length;
  const total = 6; // 5 lessen + quiz
  const completed = completedLessons + (progress.quizDone ? 1 : 0);
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">
          Je bent{" "}
          <span className="text-primary-600">{pct}%</span> van je leerparcours voltooid
        </p>
        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
          {completed} / {total}
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className="bg-primary-500 h-3 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-gray-400">Lessen:</span>
        {progress.openedLessons.map((done, i) => (
          <span
            key={i}
            className={clsx("text-base transition-opacity", done ? "opacity-100" : "opacity-20")}
            title={done ? `Les ${i + 1} voltooid` : `Les ${i + 1} nog te doen`}
          >
            ⭐
          </span>
        ))}
        <span
          className={clsx("text-base ml-1 transition-opacity", progress.quizDone ? "opacity-100" : "opacity-20")}
          title={progress.quizDone ? "Quiz voltooid!" : "Quiz nog te doen"}
        >
          🏆
        </span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Kostenverschil grafiek (Les 2)
// ────────────────────────────────────────────────────────────────────────────

interface KostenDataPoint {
  jaar: string;
  actief: number;
  passief: number;
}

function generateKostenData(): KostenDataPoint[] {
  const startBedrag = 10_000;
  const brutRendement = 0.07;
  const data: KostenDataPoint[] = [];
  for (let y = 0; y <= 30; y++) {
    data.push({
      jaar: `${y}`,
      actief: Math.round(startBedrag * Math.pow(1 + brutRendement - 0.015, y)),
      passief: Math.round(startBedrag * Math.pow(1 + brutRendement - 0.002, y)),
    });
  }
  return data;
}

const KOSTEN_DATA = generateKostenData();

function KostenVergelijking() {
  const last = KOSTEN_DATA[KOSTEN_DATA.length - 1];
  const verschil = last.passief - last.actief;

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">
        📈 Impact van kosten op €10.000 over 30 jaar (bij 7% bruto rendement)
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-0.5">
          <p className="text-xs text-red-500">Actief fonds (1,5% kosten)</p>
          <p className="text-xl font-bold text-red-700">{fmtEur(last.actief)}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 space-y-0.5">
          <p className="text-xs text-green-600">Passieve ETF (0,2% kosten)</p>
          <p className="text-xl font-bold text-green-700">{fmtEur(last.passief)}</p>
        </div>
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 space-y-0.5 col-span-2 sm:col-span-1">
          <p className="text-xs text-primary-600">Kostenverschil na 30 jaar</p>
          <p className="text-xl font-bold text-primary-700">+{fmtEur(verschil)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={KOSTEN_DATA} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="jaar"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => (parseInt(v) % 5 === 0 ? `J${v}` : "")}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `€${Math.round(v / 1000)}k`}
          />
          <Tooltip
            formatter={(value: number) => [fmtEur(value), ""]}
            labelFormatter={(l: string) => `Jaar ${l}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="actief"
            name="Actief fonds (1,5%)"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="passief"
            name="Passieve ETF (0,2%)"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 text-center">
        * Startbedrag €10.000 eenmalig belegd. Geen verdere inleg. Geen garantie op toekomstig rendement.
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DCA Simulator
// ────────────────────────────────────────────────────────────────────────────

interface DcaDataPoint {
  jaar: string;
  gestort: number;
  eindwaarde: number;
}

function generateDcaData(monthly: number, years: number): DcaDataPoint[] {
  const monthlyRate = Math.pow(1.07, 1 / 12) - 1;
  const data: DcaDataPoint[] = [];
  for (let y = 1; y <= years; y++) {
    const n = y * 12;
    const fv = monthly * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate);
    data.push({
      jaar: `Jaar ${y}`,
      gestort: Math.round(monthly * n),
      eindwaarde: Math.round(fv),
    });
  }
  return data;
}

function fmtEur(n: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function DcaSimulator() {
  const [monthly, setMonthly] = useState(150);
  const [years, setYears] = useState(20);

  const data = useMemo(() => generateDcaData(monthly, years), [monthly, years]);
  const last = data[data.length - 1];
  const totalGestort = last?.gestort ?? 0;
  const eindwaarde = last?.eindwaarde ?? 0;
  const winst = eindwaarde - totalGestort;
  const rendementPct = totalGestort > 0 ? Math.round((winst / totalGestort) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">
            Maandelijks bedrag:{" "}
            <span className="text-primary-600 font-bold">{fmtEur(monthly)}</span>
          </label>
          <input
            type="range"
            min={50}
            max={500}
            step={10}
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value))}
            className="w-full accent-primary-500"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>€50</span>
            <span>€500</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">
            Beleggingshorizon:{" "}
            <span className="text-primary-600 font-bold">{years} jaar</span>
          </label>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-primary-500"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>5 jaar</span>
            <span>30 jaar</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Totaal gestort", value: fmtEur(totalGestort), color: "text-gray-900" },
          { label: "Eindwaarde", value: fmtEur(eindwaarde), color: "text-primary-600" },
          { label: "Winst", value: fmtEur(winst), color: "text-green-600" },
          { label: "Rendement", value: `+${rendementPct}%`, color: "text-emerald-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-3 space-y-1">
            <p className="text-xs text-gray-400">{label}</p>
            <p className={clsx("text-lg font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="gradGestort" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradEindwaarde" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="jaar"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => v.replace("Jaar ", "J")}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) =>
              v >= 1000 ? `€${Math.round(v / 1000)}k` : `€${v}`
            }
          />
          <Tooltip
            formatter={(value: number) => [fmtEur(value), ""]}
            labelFormatter={(l: string) => l}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="gestort"
            name="Totaal gestort"
            stroke="#94a3b8"
            fill="url(#gradGestort)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="eindwaarde"
            name="Eindwaarde"
            stroke="#22c55e"
            fill="url(#gradEindwaarde)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-xs text-gray-400 text-center">
        * Simulatie op basis van 7% gemiddeld jaarlijks rendement (historisch gemiddelde breed gespreide
        ETF). Geen garantie op toekomstig rendement.
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Quiz
// ────────────────────────────────────────────────────────────────────────────

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Wat is de gemiddelde TER van een brede ETF?",
    options: ["0,10%", "1,5%", "0,50%"],
    correct: 0,
    explanation:
      "Brede ETF's zoals VWCE hebben een TER van rond de 0,07–0,22%. Actieve fondsen rekenen gemiddeld 1,5% per jaar.",
  },
  {
    question: "Hoeveel % van actieve fondsbeheerders doet het beter dan de index over 10 jaar?",
    options: ["75%", "50%", "Minder dan 10%"],
    correct: 2,
    explanation:
      "Meer dan 90% van actieve fondsbeheerders scoort slechter dan de marktindex over 10+ jaar (SPIVA-rapport).",
  },
  {
    question: "Wat betekent 'accumulerend'?",
    options: [
      "Dividenden worden herbelegd",
      "Je krijgt maandelijks dividend",
      "Hogere kosten",
    ],
    correct: 0,
    explanation:
      "Een accumulerende ETF herbelegt dividenden automatisch. Dit versterkt het rente-op-rente effect en is fiscaal interessant in België.",
  },
  {
    question: "Wat is DCA?",
    options: [
      "Elke maand hetzelfde bedrag beleggen",
      "Snel in- en uitstappen",
      "Beleggen in één keer",
    ],
    correct: 0,
    explanation:
      "Dollar Cost Averaging = elke maand een vast bedrag beleggen, ongeacht de koers. Dit middelt je aankoopprijs over de tijd.",
  },
  {
    question: "TOB in België bedraagt:",
    options: ["0,35%", "30%", "1%"],
    correct: 0,
    explanation:
      "De Taks op Beursverrichtingen (TOB) bedraagt 0,35% bij aankoop en verkoop van een accumulerende ETF in België.",
  },
];

interface HangmatQuizProps {
  onComplete: () => void;
}

function HangmatQuiz({ onComplete }: HangmatQuizProps) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(QUIZ_QUESTIONS.length).fill(null)
  );
  const [revealed, setRevealed] = useState<boolean[]>(
    Array(QUIZ_QUESTIONS.length).fill(false)
  );
  const [done, setDone] = useState(false);

  const score = answers.filter((a, i) => a === QUIZ_QUESTIONS[i].correct).length;
  const allAnswered = !answers.includes(null);

  function handleSelect(qi: number, oi: number) {
    if (revealed[qi]) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[qi] = oi;
      return next;
    });
    setRevealed((prev) => {
      const next = [...prev];
      next[qi] = true;
      return next;
    });
  }

  function handleFinish() {
    setDone(true);
    localStorage.setItem("quizCompleted", "true");
    onComplete();
  }

  return (
    <div className="space-y-6">
      {QUIZ_QUESTIONS.map((q, qi) => (
        <div key={qi} className="space-y-3">
          <p className="font-semibold text-gray-800">
            {qi + 1}. {q.question}
          </p>
          <div className="grid sm:grid-cols-3 gap-2">
            {q.options.map((opt, oi) => {
              const selected = answers[qi] === oi;
              const isCorrect = oi === q.correct;
              const show = revealed[qi];
              return (
                <button
                  key={oi}
                  onClick={() => handleSelect(qi, oi)}
                  disabled={revealed[qi]}
                  className={clsx(
                    "text-left text-sm px-4 py-2.5 rounded-xl border-2 transition-all",
                    show && isCorrect && "border-green-500 bg-green-50 text-green-800 font-medium",
                    show && selected && !isCorrect && "border-red-400 bg-red-50 text-red-700",
                    show && !selected && !isCorrect && "border-gray-100 text-gray-300",
                    !show &&
                      "border-gray-200 hover:border-primary-300 hover:bg-primary-50 cursor-pointer"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {revealed[qi] && (
            <div
              className={clsx(
                "text-sm rounded-xl px-4 py-3",
                answers[qi] === q.correct
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              )}
            >
              {answers[qi] === q.correct ? "✅ " : "❌ "}
              {q.explanation}
            </div>
          )}
        </div>
      ))}

      {allAnswered && !done && (
        <button onClick={handleFinish} className="btn-primary w-full">
          Bekijk mijn eindscore
        </button>
      )}

      {done && (
        <div
          className={clsx(
            "rounded-2xl p-6 text-center space-y-3",
            score === 5
              ? "bg-green-50 border border-green-200"
              : score >= 3
              ? "bg-primary-50 border border-primary-100"
              : "bg-orange-50 border border-orange-200"
          )}
        >
          <p className="text-4xl font-bold text-gray-900">{score} / 5</p>
          <p className="text-sm text-gray-700">
            {score === 5
              ? "🏆 Perfect! Jij bent klaar voor je eerste belegging."
              : score >= 3
              ? "🎉 Goed bezig! Je begrijpt de basis al goed."
              : "📚 Lees de lessen nog eens door — je haalt het zeker!"}
          </p>
          <Link
            href="/onboarding"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            Maak nu mijn persoonlijk plan →
          </Link>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Accordion les-wrapper
// ────────────────────────────────────────────────────────────────────────────

interface LessonProps {
  index: number;
  title: string;
  emoji: string;
  isOpen: boolean;
  isDone: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Lesson({ index, title, emoji, isOpen, isDone, onToggle, children }: LessonProps) {
  return (
    <div
      className={clsx(
        "bg-white rounded-2xl shadow-sm border transition-all",
        isOpen ? "border-primary-200 ring-2 ring-primary-100" : "border-gray-100"
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-6 text-left"
      >
        <div
          className={clsx(
            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
            isDone ? "bg-green-100 text-green-700" : "bg-primary-50 text-primary-700"
          )}
        >
          {isDone ? "⭐" : index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Les {index + 1}</span>
          <h2 className="font-semibold text-gray-900">
            {emoji} {title}
          </h2>
        </div>
        <span
          className={clsx(
            "text-gray-400 transition-transform duration-200 text-xs shrink-0",
            isOpen && "rotate-180"
          )}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Hoofdpagina
// ────────────────────────────────────────────────────────────────────────────

export default function LerenPage() {
  const [openLesson, setOpenLesson] = useState<number | null>(null);
  const [progress, setProgress] = useState<LerenProgress>(DEFAULT_PROGRESS);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  function toggleLesson(i: number) {
    setOpenLesson((prev) => (prev === i ? null : i));
    if (!progress.openedLessons[i]) {
      const next: LerenProgress = {
        ...progress,
        openedLessons: progress.openedLessons.map((v, idx) => (idx === i ? true : v)),
      };
      setProgress(next);
      saveProgress(next);
    }
  }

  function handleQuizComplete() {
    const next: LerenProgress = { ...progress, quizDone: true };
    setProgress(next);
    saveProgress(next);
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-3">
        <span className="inline-block bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full">
          🇧🇪 Woord van het jaar 2024
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Hangmatbeleggen leerpad 🛏️
        </h1>
        <p className="text-gray-500 text-lg leading-relaxed">
          In 5 lessen leer je alles over passief beleggen — de bewezen strategie voor beginners.
          Geen jargon, geen gedoe.
        </p>
      </div>

      {/* Voortgangsindicator */}
      <ProgressBar progress={progress} />

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        ⚠️ Dit is educatieve informatie, geen financieel advies. Beleg alleen geld dat je lange
        tijd kunt missen.{" "}
        <Link href="/disclaimer" className="underline hover:text-amber-900 font-medium">
          Meer info
        </Link>
      </div>

      {/* Lessen accordion */}
      <div className="space-y-4">
        {/* Les 1 */}
        <Lesson
          index={0}
          title="Wat is hangmatbeleggen?"
          emoji="🛏️"
          isOpen={openLesson === 0}
          isDone={progress.openedLessons[0]}
          onToggle={() => toggleLesson(0)}
        >
          <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
            <p>
              <strong>Hangmatbeleggen</strong> werd woord van het jaar 2024 in België — en terecht.
              Het beschrijft perfect passief beleggen: je koopt één ETF die een index volgt en doet
              daarna niets. Letterlijk in de hangmat liggen.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-red-800">😤 Actief beleggen</p>
                <ul className="space-y-1.5 text-red-700 text-sm">
                  <li>• Aandelen picken (&ldquo;welk bedrijf gaat stijgen?&rdquo;)</li>
                  <li>• Continu de markt in de gaten houden</li>
                  <li>• Hoge kosten (1,5%+ TER per jaar)</li>
                  <li>• 90%+ van fondsbeheerders verliest van de index</li>
                </ul>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-green-800">😌 Passief beleggen (hangmat)</p>
                <ul className="space-y-1.5 text-green-700 text-sm">
                  <li>• Koop een ETF die de volledige markt volgt</li>
                  <li>• Maandelijks automatisch inleggen (DCA)</li>
                  <li>• Lage kosten (0,07–0,22% TER)</li>
                  <li>• Bewezen effectief over de lange termijn</li>
                </ul>
              </div>
            </div>

            <div className="bg-primary-50 rounded-xl p-4">
              <p className="font-semibold text-primary-800 mb-1">💡 Kernboodschap</p>
              <p className="text-primary-700">
                Je hoeft geen expert te zijn. Je hoeft de markt niet te volgen. Koop elke maand een
                wereldwijd gespreide ETF en ga letterlijk in de hangmat liggen.
              </p>
            </div>
          </div>
        </Lesson>

        {/* Les 2 */}
        <Lesson
          index={1}
          title="Waarom werkt het?"
          emoji="📊"
          isOpen={openLesson === 1}
          isDone={progress.openedLessons[1]}
          onToggle={() => toggleLesson(1)}
        >
          <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800 mb-2">📉 SPIVA-onderzoek</p>
                <p className="text-5xl font-bold text-red-600">90%+</p>
                <p className="text-gray-600 mt-2">
                  van actieve fondsbeheerders scoort{" "}
                  <strong>slechter</strong> dan de marktindex over 10+ jaar.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800 mb-3">💰 Kosten zijn de vijand</p>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Actief fonds</span>
                    <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">
                      ~1,5% TER
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Passieve ETF</span>
                    <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">
                      0,07–0,22% TER
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Over 30 jaar maakt dit tienduizenden euro&apos;s verschil.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="font-semibold text-yellow-800 mb-1">🧠 Albert Einstein</p>
              <blockquote className="text-yellow-700 italic">
                &ldquo;Rente op rente is het achtste wereldwonder. Wie het begrijpt, verdient het;
                wie het niet begrijpt, betaalt het.&rdquo;
              </blockquote>
            </div>

            <KostenVergelijking />

            <div className="bg-primary-50 rounded-xl p-4">
              <p className="font-semibold text-primary-800 mb-1">
                💡 Je betaalt voor underperformance
              </p>
              <p className="text-primary-700">
                Bij een actief fonds betaal je 1,5% per jaar voor een beheerder die de markt
                statistisch niet verslaat. Bij een ETF betaal je 0,10% voor automatisch de
                volledige markt bezitten. De keuze is simpel.
              </p>
            </div>
          </div>
        </Lesson>

        {/* Les 3 */}
        <Lesson
          index={2}
          title="Hoe begin je?"
          emoji="🚀"
          isOpen={openLesson === 2}
          isDone={progress.openedLessons[2]}
          onToggle={() => toggleLesson(2)}
        >
          <div className="space-y-5 text-gray-700 text-sm leading-relaxed">
            {[
              {
                step: 1,
                emoji: "⏱️",
                title: "Kies je beleggingshorizon",
                desc: "Hoelang wil je beleggen? Minimum 5 jaar aanbevolen. Hoe langer, hoe groter het voordeel van rente-op-rente.",
                link: null as { href: string; label: string } | null,
              },
              {
                step: 2,
                emoji: "🎚️",
                title: "Bepaal je risicoprofiel",
                desc: "Hoeveel verlies kun je emotioneel dragen? Onze quiz helpt je dit inschatten in 4 vragen.",
                link: { href: "/onboarding", label: "Doe de quiz →" },
              },
              {
                step: 3,
                emoji: "📦",
                title: "Kies een ETF",
                desc: "VWCE (Vanguard All-World) of IWDA (iShares Core MSCI World) zijn populaire keuzes voor Belgische beginners.",
                link: { href: "/etfs/compare", label: "Vergelijk ETF's →" },
              },
              {
                step: 4,
                emoji: "🏦",
                title: "Open een rekening bij een Belgische broker",
                desc: "Bolero (KBC), Keytrade Bank en DEGIRO zijn populaire opties. Vergelijk tarieven voor jouw situatie.",
                link: null,
              },
              {
                step: 5,
                emoji: "🔄",
                title: "Stel een maandelijkse automatische storting in (DCA)",
                desc: "Kies een vaste dag per maand en automatiseer je inleg. Vergeet het daarna. In de hangmat!",
                link: null,
              },
            ].map(({ step, emoji, title, desc, link }) => (
              <div key={step} className="flex gap-4">
                <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                  {step}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {emoji} {title}
                  </p>
                  <p className="text-gray-500 mt-0.5">{desc}</p>
                  {link && (
                    <Link
                      href={link.href}
                      className="text-primary-600 hover:underline text-xs font-semibold mt-1.5 inline-block"
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Lesson>

        {/* Les 4 */}
        <Lesson
          index={3}
          title="Dollar Cost Averaging (DCA) simulator"
          emoji="💰"
          isOpen={openLesson === 3}
          isDone={progress.openedLessons[3]}
          onToggle={() => toggleLesson(3)}
        >
          <div className="space-y-6">
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>DCA (Dollar Cost Averaging)</strong> = elke maand hetzelfde bedrag
                investeren, ongeacht of de markt hoog of laag staat. Soms koop je duur, soms
                goedkoop — gemiddeld betaal je een faire prijs.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { emoji: "📅", text: "Elke maand zelfde bedrag" },
                  { emoji: "📈", text: "Soms duur, soms goedkoop" },
                  { emoji: "⚖️", text: "Gemiddeld een faire prijs" },
                ].map(({ emoji, text }) => (
                  <div key={text} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-2xl mb-1">{emoji}</div>
                    <p className="text-gray-600 font-medium text-xs">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <DcaSimulator />
          </div>
        </Lesson>

        {/* Les 5 */}
        <Lesson
          index={4}
          title="Quiz — Test je kennis"
          emoji="🎓"
          isOpen={openLesson === 4}
          isDone={progress.openedLessons[4]}
          onToggle={() => toggleLesson(4)}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              5 vragen over de lesstof. Je krijgt direct feedback en uitleg per vraag.
            </p>
            <HangmatQuiz onComplete={handleQuizComplete} />
          </div>
        </Lesson>
      </div>

      {/* Bottom CTA */}
      <div className="bg-primary-500 rounded-3xl p-8 sm:p-12 text-white text-center space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold">Klaar om te beginnen?</h2>
        <p className="text-primary-100 text-sm">
          Je hebt de basis geleerd. Maak nu jouw persoonlijk beleggingsplan in 4 vragen.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/onboarding"
            className="bg-white text-primary-600 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors inline-flex items-center gap-2 justify-center"
          >
            Maak mijn plan →
          </Link>
          <Link
            href="/etfs/compare"
            className="border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-400 transition-colors inline-flex items-center gap-2 justify-center"
          >
            Bekijk ETF&apos;s
          </Link>
        </div>
      </div>
    </div>
  );
}
