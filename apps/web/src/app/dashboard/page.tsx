"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, BookOpen, Lightbulb, ArrowRight, CalendarCheck, Grid3x3 } from "lucide-react";
import {
  loadProfile,
  calcProjectedValue,
  getSuggestedETF,
  goalLabel,
  riskLabel,
  type UserProfile,
} from "@/lib/profile";
import { api, toETFCardProps, type BackendETF } from "@/lib/api";
import FearGreedWidget from "@/components/dashboard/FearGreedWidget";

function fmt(n: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Goedemorgen";
  if (h < 18) return "Goedemiddag";
  return "Goedenavond";
}

interface NavCategory {
  name: string;
  items: Array<{
    href: string;
    emoji: string;
    label: string;
  }>;
}

const DASHBOARD_CATEGORIES: NavCategory[] = [
  {
    name: "Snel starten",
    items: [
      { href: "/etfs", emoji: "🔍", label: "ETF's ontdekken" },
      { href: "/etfs/compare", emoji: "⚖️", label: "Vergelijken" },
      { href: "/plan", emoji: "📈", label: "Mijn Plan" },
      { href: "/portfolio", emoji: "💼", label: "Portfolio" },
    ],
  },
  {
    name: "Leren & Groeien",
    items: [
      { href: "/learn", emoji: "📚", label: "Leercentrum" },
      { href: "/bronnen", emoji: "🔗", label: "Bronnen" },
      { href: "/leren", emoji: "📖", label: "Leerpad" },
    ],
  },
  {
    name: "Analyseren",
    items: [
      { href: "/analytics/etfs", emoji: "📊", label: "ETF Analyse" },
      { href: "/scenario", emoji: "🎯", label: "Scenario's" },
      { href: "/fire", emoji: "🔥", label: "FIRE Calculator" },
    ],
  },
  {
    name: "Mijn portfolio",
    items: [
      { href: "/checkin", emoji: "✅", label: "Check-in" },
      { href: "/chat", emoji: "🤖", label: "AI Coach" },
      { href: "/markt", emoji: "📈", label: "Markt & Koersen" },
    ],
  },
];

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [suggestedETF, setSuggestedETF] = useState<BackendETF | null>(null);

  // Laad profiel uit localStorage (migratie naar backend is een aparte taak)
  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  // Haal ETF-data op zodra het profiel bekend is
  useEffect(() => {
    if (!profile) return;

    const suggestedTicker = getSuggestedETF(profile.risk);

    api.etfs
      .list()
      .then((etfs) => {
        const match = etfs.find((e) => e.ticker === suggestedTicker) ?? etfs[0] ?? null;
        setSuggestedETF(match);
      })
      .catch(() => {
        // Graceful degradation — ETF-sectie wordt weggelaten bij API-fout
        setSuggestedETF(null);
      });
  }, [profile]);

  if (profile === undefined) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-56" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card py-4 flex flex-col items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="h-3 bg-gray-100 rounded w-14" />
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card space-y-2">
              <div className="h-3 bg-gray-100 rounded w-20" />
              <div className="h-6 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-16">
        <div className="text-5xl">👋</div>
        <h1 className="text-2xl font-bold text-gray-900">Welkom bij BeleggenCoach</h1>
        <p className="text-gray-500">
          Je hebt nog geen persoonlijk profiel aangemaakt. Beantwoord 4 korte vragen en we tonen
          wat bij jou past.
        </p>
        <Link href="/onboarding" className="btn-primary inline-flex items-center gap-2">
          Maak mijn plan <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const projected = calcProjectedValue(profile.monthly, profile.years, 0.06);
  const etfProps = suggestedETF ? toETFCardProps(suggestedETF) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{getGreeting()} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Hier is een overzicht van jouw beleggingsplan.</p>
      </div>

      {/* Categorieën Grid */}
      <div className="space-y-6">
        {DASHBOARD_CATEGORIES.map((category) => (
          <div key={category.name}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Grid3x3 className="w-5 h-5 text-primary-600" />
              {category.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {category.items.map(({ href, emoji, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="card flex flex-col items-center justify-center gap-3 py-5 px-3 hover:border-primary-300 border border-transparent hover:shadow-md hover:bg-primary-50 transition-all text-center group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">
                    {emoji}
                  </span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Fear & Greed Widget */}
      <FearGreedWidget />

      {/* Stats row */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Doel</p>
          <p className="text-lg font-semibold text-gray-900">{goalLabel(profile.goal)}</p>
        </div>
        <div className="card space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Maandelijkse inleg</p>
          <p className="text-lg font-semibold text-gray-900">{fmt(profile.monthly)}</p>
        </div>
        <div className="card space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            Verwacht na {profile.years} jaar
          </p>
          <p className="text-lg font-semibold text-primary-600">{fmt(projected)}</p>
          <p className="text-xs text-gray-400">bij realistisch 6% rendement</p>
        </div>
      </div>

      {/* ETF suggestie — alleen tonen als data beschikbaar is */}
      {etfProps && (
        <div className="card flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-accent-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
              Past mogelijk bij jouw profiel ({riskLabel(profile.risk)})
            </p>
            <p className="font-bold text-gray-900">
              {etfProps.ticker} — {etfProps.name}
            </p>
            <p className="text-sm text-gray-500">{etfProps.description}</p>
          </div>
          <Link href="/etfs" className="btn-secondary text-sm shrink-0 flex items-center gap-1">
            Bekijk ETF&apos;s <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Bottom row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <div className="flex items-center gap-2 text-accent-600">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-semibold">Volgende lesstap</span>
          </div>
          <p className="text-gray-900 font-medium">Wat is diversificatie?</p>
          <p className="text-sm text-gray-500">
            Diversificatie betekent dat je je geld spreidt over veel bedrijven, zodat één mislukking
            niet alles ruïneert.
          </p>
          <Link
            href="/learn"
            className="text-sm text-primary-600 font-medium hover:underline flex items-center gap-1"
          >
            Naar leercentrum <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center gap-2 text-primary-600">
            <Lightbulb className="w-4 h-4" />
            <span className="text-sm font-semibold">Gedragstip</span>
          </div>
          <p className="text-gray-800">Consistent beleggen werkt. Jij bent op de goede weg. 💚</p>
          <p className="text-sm text-gray-500">
            Consistent beleggen werkt beter dan proberen de markt te timen. Leg vast in op dezelfde
            dag van de maand.
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/plan" className="btn-primary inline-flex items-center gap-2 justify-center">
          Bekijk mijn volledige plan <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/checkin" className="btn-secondary inline-flex items-center gap-2 justify-center">
          <CalendarCheck className="w-4 h-4" /> Maandelijkse check-in
        </Link>
      </div>
    </div>
  );
}
