"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";

const TIPS = [
  "💡 Tip: Accumulerende ETFs zijn vaak fiscaal voordeliger in België dan distributerende.",
  "💡 Tip: DCA werkt beter dan proberen de markt te timen — gewoon elke maand inleggen.",
  "💡 Tip: Controleer elke 6 maanden je portefeuille, niet vaker. Rust is je beste strategie.",
];

export default function HomeWidgets() {
  const [quizDone, setQuizDone] = useState<boolean | null>(null);
  const [tipIndex] = useState(() => Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % TIPS.length);

  useEffect(() => {
    setQuizDone(localStorage.getItem("quizCompleted") === "true");
  }, []);

  return (
    <div className="space-y-6">
      {/* Start je leerpad banner — alleen tonen als quiz nog niet gedaan */}
      {quizDone === false && (
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-4xl">🛏️</div>
          <div className="flex-1">
            <p className="font-semibold text-primary-900">Start je leerpad: Hangmatbeleggen</p>
            <p className="text-sm text-primary-700 mt-0.5">
              Leer in 5 lessen hoe passief beleggen werkt — woord van het jaar 2024 in België.
            </p>
          </div>
          <Link
            href="/leren"
            className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2 shrink-0"
          >
            Begin nu <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Snelle statistiek blokken */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Historisch gemiddeld</p>
          <p className="text-2xl font-bold text-green-600">+7% / jaar</p>
          <p className="text-xs text-gray-500">Breed gespreide ETF (MSCI World, 30j gemiddelde)</p>
        </div>
        <div className="card space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Gemiddelde ETF-kosten</p>
          <p className="text-2xl font-bold text-primary-600">0,10% TER</p>
          <p className="text-xs text-gray-500">vs. ~1,5% bij actieve fondsen — groot verschil!</p>
        </div>
        <div className="card space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Actieve fondsbeheerders</p>
          <p className="text-2xl font-bold text-red-500">90%+</p>
          <p className="text-xs text-gray-500">scoort slechter dan de index over 10 jaar (SPIVA)</p>
        </div>
      </div>

      {/* Educatieve tip widget */}
      <div className="card flex items-start gap-4">
        <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Tip van de dag</p>
          <p className="text-sm text-gray-700 font-medium">{TIPS[tipIndex]}</p>
        </div>
        <Link
          href="/leren"
          className="text-xs text-primary-600 hover:underline font-medium shrink-0"
        >
          Meer leren →
        </Link>
      </div>
    </div>
  );
}
