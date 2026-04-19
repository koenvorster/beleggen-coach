"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, ArrowLeft } from "lucide-react";

type Emotion = "rustig" | "bezorgd" | "gefrustreerd" | "enthousiast";
type Intent = "hou" | "meer" | "minder" | "stoppen";

interface CheckinState {
  ingelegd: boolean | null;
  emotion: Emotion | null;
  intent: Intent | null;
}

const EMOTIONS: { value: Emotion; label: string; emoji: string }[] = [
  { value: "rustig", label: "Rustig", emoji: "😌" },
  { value: "bezorgd", label: "Bezorgd", emoji: "😟" },
  { value: "gefrustreerd", label: "Gefrustreerd", emoji: "😤" },
  { value: "enthousiast", label: "Enthousiast", emoji: "🚀" },
];

const INTENTS: { value: Intent; label: string }[] = [
  { value: "hou", label: "Nee, ik hou me aan mijn plan" },
  { value: "meer", label: "Ik wil meer beleggen" },
  { value: "minder", label: "Ik wil minder beleggen" },
  { value: "stoppen", label: "Ik wil stoppen" },
];

function coachMessage(emotion: Emotion | null, intent: Intent | null): string {
  if (emotion === "bezorgd" && intent === "stoppen") {
    return "Het is normaal om je zorgen te maken. Wist je dat de markt in het verleden altijd hersteld is na grote dalingen? Neem geen beslissing in paniek — geef jezelf minstens 48 uur.";
  }
  if (emotion === "enthousiast" && intent === "meer") {
    return "Leuk! Maar check eerst of je noodfonds nog op orde is (3-6 maanden aan uitgaven). Investeer alleen wat je echt kunt missen.";
  }
  if (emotion === "gefrustreerd") {
    return "Frustratie is begrijpelijk als je ziet dat het even minder gaat. Herinner jezelf: jij belegt voor de lange termijn, niet voor vandaag. De markt heeft historisch altijd hersteld.";
  }
  if (emotion === "rustig" && intent === "hou") {
    return "Perfect. Consistentie is de sleutel. Jij doet het precies goed — blijf zo!";
  }
  if (intent === "stoppen" || intent === "minder") {
    return "Grote beslissingen neem je best niet in emotionele momenten. Slaap er nog eens over. Jouw langetermijnplan is je houvast, niet de koers van vandaag.";
  }
  return "Goed dat je even incheckt! Consistent beleggen en je plan respecteren is de sleutel tot succes op lange termijn.";
}

export default function CheckinPage() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<CheckinState>({
    ingelegd: null,
    emotion: null,
    intent: null,
  });

  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const coach = coachMessage(state.emotion, state.intent);
  const showWarning =
    state.intent === "stoppen" ||
    state.intent === "minder" ||
    state.emotion === "bezorgd" ||
    state.emotion === "gefrustreerd";

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Maandelijkse check-in 📋</h1>
        <p className="text-sm text-gray-500">Even inhecken hoe het gaat met jouw beleggingsreis.</p>
      </div>

      {/* Step 1: Ingelegd? */}
      {step === 0 && (
        <div className="card space-y-6">
          <h2 className="font-semibold text-gray-900 text-lg">Heb je deze maand ingelegd?</h2>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setState({ ...state, ingelegd: true });
                next();
              }}
              className="flex-1 btn-primary"
            >
              ✅ Ja
            </button>
            <button
              onClick={() => {
                setState({ ...state, ingelegd: false });
                next();
              }}
              className="flex-1 btn-secondary"
            >
              ❌ Nee
            </button>
          </div>
        </div>
      )}

      {/* Encouragement if not ingelegd */}
      {step === 1 && state.ingelegd === false && (
        <div className="card space-y-4">
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 space-y-2">
            <p className="text-2xl">🤗</p>
            <p className="font-semibold text-primary-800">Geen probleem!</p>
            <p className="text-sm text-gray-700">
              Dat kan gebeuren — onverwachte uitgaven, vergeten... Het is oké. Probeer deze maand
              wél in te leggen, al is het maar een klein bedrag. Consistentie is belangrijker dan
              het exacte bedrag.
            </p>
          </div>
          <div className="flex justify-between">
            <button onClick={prev} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Terug
            </button>
            <button onClick={next} className="btn-primary flex items-center gap-2">
              Verder <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Skip encouragement card if did invest */}
      {step === 1 && state.ingelegd === true && (
        <div className="card space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
            <p className="text-2xl">🎉</p>
            <p className="font-semibold text-green-800">Geweldig gedaan!</p>
            <p className="text-sm text-gray-700">
              Je hebt deze maand ingelegd. Elke inleg brengt je dichter bij jouw doel. 💪
            </p>
          </div>
          <div className="flex justify-end">
            <button onClick={next} className="btn-primary flex items-center gap-2">
              Verder <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Emotion */}
      {step === 2 && (
        <div className="card space-y-6">
          <h2 className="font-semibold text-gray-900 text-lg">
            Hoe voel je je vandaag over je beleggingen?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {EMOTIONS.map((e) => (
              <button
                key={e.value}
                onClick={() => setState({ ...state, emotion: e.value })}
                className={clsx(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  state.emotion === e.value
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-primary-300"
                )}
              >
                <span className="text-3xl">{e.emoji}</span>
                <span className="text-sm font-medium text-gray-800">{e.label}</span>
              </button>
            ))}
          </div>
          {state.emotion && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
              {state.emotion === "rustig" && "Goed! Een rustig hoofd is de beste basis voor succesvol beleggen."}
              {state.emotion === "bezorgd" && "Zorgen zijn normaal. We helpen je er doorheen."}
              {state.emotion === "gefrustreerd" && "Frustratie begrijpen we. Even doorademen helpt vaak."}
              {state.emotion === "enthousiast" && "Dat enthousiasme is fijn! Hou het in balans met je strategie."}
            </div>
          )}
          <div className="flex justify-between">
            <button onClick={() => setStep(0)} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Terug
            </button>
            <button
              onClick={next}
              disabled={!state.emotion}
              className={clsx(
                "btn-primary flex items-center gap-2",
                !state.emotion && "opacity-50 cursor-not-allowed"
              )}
            >
              Verder <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Intent */}
      {step === 3 && (
        <div className="card space-y-6">
          <h2 className="font-semibold text-gray-900 text-lg">
            Heb je de neiging om iets te veranderen aan je plan?
          </h2>
          <div className="space-y-3">
            {INTENTS.map((intent) => (
              <button
                key={intent.value}
                onClick={() => setState({ ...state, intent: intent.value })}
                className={clsx(
                  "w-full text-left p-4 rounded-xl border-2 text-sm font-medium transition-all",
                  state.intent === intent.value
                    ? "border-primary-500 bg-primary-50 text-primary-800"
                    : "border-gray-200 hover:border-primary-300 text-gray-700"
                )}
              >
                {intent.label}
              </button>
            ))}
          </div>
          {(state.intent === "stoppen" || state.intent === "minder") && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <strong>Even pauzeren:</strong> Grote beslissingen zijn het best genomen na een
              rustig moment. Lees onze gedragstip in de samenvatting.
            </div>
          )}
          <div className="flex justify-between">
            <button onClick={prev} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Terug
            </button>
            <button
              onClick={next}
              disabled={!state.intent}
              className={clsx(
                "btn-primary flex items-center gap-2",
                !state.intent && "opacity-50 cursor-not-allowed"
              )}
            >
              Samenvatting <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Summary */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900 text-lg">Jouw check-in samenvatting</h2>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>
                💶 <strong>Ingelegd deze maand:</strong>{" "}
                {state.ingelegd ? "Ja ✅" : "Nee ❌"}
              </li>
              <li>
                😊 <strong>Gevoel:</strong>{" "}
                {EMOTIONS.find((e) => e.value === state.emotion)?.emoji}{" "}
                {EMOTIONS.find((e) => e.value === state.emotion)?.label}
              </li>
              <li>
                🎯 <strong>Planwijziging:</strong>{" "}
                {INTENTS.find((i) => i.value === state.intent)?.label}
              </li>
            </ul>
          </div>

          <div
            className={clsx(
              "rounded-2xl p-5 space-y-2",
              showWarning
                ? "bg-amber-50 border border-amber-200"
                : "bg-primary-50 border border-primary-100"
            )}
          >
            <p className="font-semibold text-gray-800">💬 Jouw coach zegt:</p>
            <p className="text-sm text-gray-700">{coach}</p>
          </div>

          <div className="text-center pt-2">
            <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
              Tot volgende maand 👋
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
