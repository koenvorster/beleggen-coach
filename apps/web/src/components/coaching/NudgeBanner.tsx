"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Nudge {
  id: string;
  message: string;
  type: "positive" | "info" | "warning";
  href?: string;
  linkLabel?: string;
}

export default function NudgeBanner() {
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const sessionKey = "nudge-dismissed";
    if (sessionStorage.getItem(sessionKey)) {
      setDismissed(true);
      return;
    }

    const streakRaw = localStorage.getItem("beleggingcoach-streak-months");
    const streak: string[] = streakRaw ? JSON.parse(streakRaw) : [];
    const quizDone = localStorage.getItem("quizCompleted") === "true";
    const totalInvested = parseFloat(
      localStorage.getItem("beleggingcoach-total-invested") ?? "0"
    );

    let chosen: Nudge | null = null;

    if (streak.length >= 3) {
      chosen = {
        id: "streak",
        message: `🔥 Geweldig! Je bent al ${streak.length} maanden consistent aan het beleggen.`,
        type: "positive",
        href: "/prestaties",
        linkLabel: "Bekijk je prestaties",
      };
    } else if (!quizDone) {
      chosen = {
        id: "quiz",
        message: "📚 Doe de kennisquiz — 5 minuten voor betere beleggingsbeslissingen.",
        type: "info",
        href: "/leren",
        linkLabel: "Start quiz",
      };
    } else if (totalInvested > 5000) {
      chosen = {
        id: "risicoscan",
        message: "🌍 Je portfolio groeit! Heb je al je spreiding gecontroleerd?",
        type: "info",
        href: "/portfolio",
        linkLabel: "Risicoscan",
      };
    } else {
      chosen = {
        id: "dca",
        message: "💡 Tip: automatisch maandelijks beleggen is bewezen de beste strategie voor beginners.",
        type: "info",
        href: "/leren",
        linkLabel: "Leer meer over DCA",
      };
    }

    setNudge(chosen);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("nudge-dismissed", "1");
    setDismissed(true);
  };

  if (!nudge || dismissed) return null;

  const colors = {
    positive: "bg-green-50 border-green-200 text-green-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
  };

  return (
    <div
      className={`border rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-sm ${colors[nudge.type]}`}
    >
      <span className="flex-1">{nudge.message}</span>
      <div className="flex items-center gap-3 shrink-0">
        {nudge.href && (
          <Link href={nudge.href} className="font-semibold underline underline-offset-2 hover:no-underline">
            {nudge.linkLabel}
          </Link>
        )}
        <button
          onClick={handleDismiss}
          className="opacity-50 hover:opacity-100 text-lg leading-none"
          aria-label="Sluiten"
        >
          ×
        </button>
      </div>
    </div>
  );
}
