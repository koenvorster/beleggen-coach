"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "@/components/onboarding/StepIndicator";
import { ArrowRight, ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { saveProfile } from "@/lib/profile";

type Goal = "pensioen" | "huis" | "studie" | "vermogen";
type Risk = "rustig" | "licht" | "accepteer";

interface OnboardingData {
  goal: Goal | null;
  monthly: number;
  years: number;
  risk: Risk | null;
}

const GOALS: { value: Goal; label: string; emoji: string }[] = [
  { value: "pensioen", label: "Pensioen opbouwen", emoji: "🏖️" },
  { value: "huis", label: "Huis kopen", emoji: "🏠" },
  { value: "studie", label: "Studie van mijn kind", emoji: "🎓" },
  { value: "vermogen", label: "Vermogen opbouwen", emoji: "💼" },
];

const RISKS: { value: Risk; label: string; desc: string }[] = [
  { value: "rustig", label: "Rustig slapen", desc: "Ik wil zo weinig mogelijk schommelingen zien." },
  { value: "licht", label: "Licht ongemak", desc: "Kleine dalingen zijn oké, grote liever niet." },
  { value: "accepteer", label: "Ik accepteer grote schommelingen", desc: "Ik hou het hoofd koel ook als het 30% daalt." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    goal: null,
    monthly: 200,
    years: 10,
    risk: null,
  });

  const steps = ["Doel", "Inleg", "Tijdshorizon", "Risico"];

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleFinish = () => {
    if (!data.goal || !data.risk) return;
    setSaving(true);
    saveProfile({
      goal: data.goal,
      monthly: data.monthly,
      years: data.years,
      risk: data.risk,
      createdAt: new Date().toISOString(),
    });
    router.push("/dashboard");
  };

  const canContinue =
    (step === 0 && data.goal !== null) ||
    step === 1 ||
    step === 2 ||
    (step === 3 && data.risk !== null);

  const goalLabel = GOALS.find((g) => g.value === data.goal)?.label ?? "—";
  const riskLabel = RISKS.find((r) => r.value === data.risk)?.label ?? "—";

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Maak jouw plan</h1>
        <p className="text-sm text-gray-500">4 eenvoudige vragen, dan tonen we wat bij jou past.</p>
      </div>

      <StepIndicator current={step} steps={steps} />

      <div data-testid="onboarding-form" className="card space-y-6">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 text-lg">Wat is je doel?</h2>
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setData({ ...data, goal: g.value })}
                  className={clsx(
                    "flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all",
                    data.goal === g.value
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-primary-300"
                  )}
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="text-sm font-medium text-gray-800">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-semibold text-gray-900 text-lg">Hoeveel wil je maandelijks inleggen?</h2>
            <div className="text-center">
              <span className="text-4xl font-bold text-primary-600">€{data.monthly}</span>
              <span className="text-gray-400 text-sm ml-1">/maand</span>
            </div>
            <input
              type="range"
              min={25}
              max={1000}
              step={25}
              value={data.monthly}
              onChange={(e) => setData({ ...data, monthly: Number(e.target.value) })}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>€25</span><span>€1.000</span>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
              💡 Zelfs €25/maand kan na 20 jaar meer dan €10.000 worden door het rente-op-rente effect.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-semibold text-gray-900 text-lg">Hoe lang kun je wachten?</h2>
            <div className="text-center">
              <span className="text-4xl font-bold text-primary-600">{data.years}</span>
              <span className="text-gray-400 text-sm ml-1">jaar</span>
            </div>
            <input
              type="range"
              min={1}
              max={40}
              step={1}
              value={data.years}
              onChange={(e) => setData({ ...data, years: Number(e.target.value) })}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>1 jaar</span><span>40 jaar</span>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
              💡 Hoe langer je belegt, hoe meer tijd de markt heeft om te herstellen van dalingen.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 text-lg">Hoe voel je je bij schommelingen?</h2>
            <p className="text-sm text-gray-500">Denk aan: als je portefeuille 20% daalt, wat doe je?</p>
            <div className="space-y-3">
              {RISKS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setData({ ...data, risk: r.value })}
                  className={clsx(
                    "w-full flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all",
                    data.risk === r.value
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-primary-300"
                  )}
                >
                  <span className="text-sm font-semibold text-gray-800">{r.label}</span>
                  <span className="text-xs text-gray-500">{r.desc}</span>
                </button>
              ))}
            </div>

            {data.goal && data.risk && (
              <div className="mt-4 bg-primary-50 border border-primary-100 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-primary-800">Jouw samenvatting</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>🎯 Doel: <strong>{goalLabel}</strong></li>
                  <li>💶 Maandelijks: <strong>€{data.monthly}</strong></li>
                  <li>⏳ Tijdshorizon: <strong>{data.years} jaar</strong></li>
                  <li>💓 Risico: <strong>{riskLabel}</strong></li>
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between pt-2">
          <button
            onClick={prev}
            disabled={step === 0}
            className={clsx(
              "btn-secondary flex items-center gap-2",
              step === 0 && "opacity-0 pointer-events-none"
            )}
          >
            <ArrowLeft className="w-4 h-4" /> Terug
          </button>

          {step < 3 ? (
            <button
              onClick={next}
              disabled={!canContinue}
              className={clsx(
                "btn-primary flex items-center gap-2",
                !canContinue && "opacity-50 cursor-not-allowed"
              )}
            >
              Volgende <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!canContinue || saving}
              className={clsx(
                "btn-primary flex items-center gap-2",
                (!canContinue || saving) && "opacity-50 cursor-not-allowed"
              )}
            >
              {saving ? "Plan wordt opgeslagen..." : "Maak mijn plan"}{" "}
              {!saving && <ArrowRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
