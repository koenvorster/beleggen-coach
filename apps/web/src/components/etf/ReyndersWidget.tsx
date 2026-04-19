"use client";

import { useState } from "react";

export interface ReyndersWidgetProps {
  bondAllocationPercent: number;
  etfName: string;
}

interface StatusConfig {
  badge: string;
  badgeClass: string;
  icon: string;
  beschrijving: string;
}

function getStatus(bondAllocationPercent: number): StatusConfig {
  if (bondAllocationPercent < 10) {
    return {
      badge: "Reynders-taks: niet van toepassing",
      badgeClass: "bg-green-100 text-green-700 border-green-200",
      icon: "✅",
      beschrijving:
        "Dit fonds belegt minder dan 10% in obligaties. De Reynders-taks is daardoor niet van toepassing.",
    };
  }
  if (bondAllocationPercent < 30) {
    return {
      badge: "Let op: Reynders-taks van toepassing op rentecomponent",
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
      icon: "🟡",
      beschrijving:
        "Dit fonds belegt meer dan 10% in obligaties. De Reynders-taks (30%) is van toepassing op het rentegedeelte van je meerwaarde.",
    };
  }
  return {
    badge: "Reynders-taks actief: 30% op rente-inkomen",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    icon: "🔴",
    beschrijving:
      "Dit fonds belegt meer dan 30% in obligaties. Een aanzienlijk deel van je meerwaarde is belastbaar aan 30% via de Reynders-taks.",
  };
}

export default function ReyndersWidget({ bondAllocationPercent, etfName }: ReyndersWidgetProps) {
  const [uitgevouwen, setUitgevouwen] = useState(false);
  const status = getStatus(bondAllocationPercent);

  return (
    <div className="rounded-xl border p-4 space-y-3 bg-white">
      {/* Badge */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span
          className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full border ${status.badgeClass}`}
        >
          {status.icon} {status.badge}
        </span>
        <button
          onClick={() => setUitgevouwen((v) => !v)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline"
          aria-expanded={uitgevouwen}
        >
          {uitgevouwen ? "Minder info" : "Meer info"}
        </button>
      </div>

      {/* Uitklapbaar */}
      {uitgevouwen && (
        <div className="space-y-3 text-sm text-gray-600 border-t pt-3">
          <p>{status.beschrijving}</p>

          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide">
              Wat is de Reynders-taks?
            </p>
            <p>
              De Reynders-taks is een Belgische belasting van <strong>30%</strong> op het
              rentegedeelte van je meerwaarde bij fondsen die meer dan <strong>10%</strong> in
              obligaties beleggen. Ze werd ingevoerd in 2018.
            </p>
          </div>

          {/* Obligatieallocatie van dit fonds */}
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{etfName} — obligatieaandeel</span>
                <span className="font-semibold">{bondAllocationPercent}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    bondAllocationPercent < 10
                      ? "bg-green-500"
                      : bondAllocationPercent < 30
                      ? "bg-amber-400"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(bondAllocationPercent, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Voorbeelden */}
          <div className="space-y-1">
            <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide">
              Voorbeelden
            </p>
            <ul className="space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>
                  <strong>VWCE</strong> (Vanguard FTSE All-World): 0% obligaties →{" "}
                  <span className="text-green-600 font-medium">geen Reynders-taks</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>
                  <strong>IWDA</strong> (iShares Core MSCI World): 0% obligaties →{" "}
                  <span className="text-green-600 font-medium">geen Reynders-taks</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">✗</span>
                <span>
                  <strong>AGGH</strong> (iShares Core € Aggregate Bond): 100% obligaties →{" "}
                  <span className="text-red-600 font-medium">volledig belast</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
