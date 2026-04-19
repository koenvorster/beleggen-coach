"use client";

import { useState } from "react";
import clsx from "clsx";

interface Concept {
  emoji: string;
  title: string;
  short: string;
  full: string;
}

const CONCEPTS: Concept[] = [
  {
    emoji: "📦",
    title: "ETF",
    short: "Een ETF (Exchange Traded Fund) is een mandje van aandelen dat je als één geheel koopt op de beurs.",
    full: "Een ETF volgt een index, zoals de MSCI World of de S&P 500. Je koopt als het ware een klein stukje van honderden of duizenden bedrijven tegelijk. Zo beleg je breed zonder zelf aandelen te moeten selecteren. ETF's worden op de beurs verhandeld, net zoals gewone aandelen.",
  },
  {
    emoji: "🌍",
    title: "Diversificatie",
    short: "Door je geld te spreiden over veel bedrijven en landen, verklein je het risico dat één mislukking alles kost.",
    full: "Als je enkel in één bedrijf belegt en dat bedrijf gaat failliet, verlies je alles. Door te spreiden over 1.000 bedrijven in 50 landen, heeft één mislukking nauwelijks effect op je totale vermogen. Diversificatie is de meest krachtige gratis 'verzekering' in beleggen.",
  },
  {
    emoji: "💸",
    title: "TER (kostenratio)",
    short: "De TER is het percentage dat het fonds jaarlijks afhoudt van jouw vermogen. Lager is beter.",
    full: "TER staat voor Total Expense Ratio. Bij een TER van 0,20% betaal je €2 per jaar op elke €1.000 belegd vermogen. Dit klinkt weinig, maar over 30 jaar maakt het een enorm verschil door het rente-op-rente effect. Vergelijk altijd de TER bij het kiezen van een ETF.",
  },
  {
    emoji: "🔄",
    title: "Rente op rente",
    short: "Als je rendement opnieuw belegt, groeit je vermogen exponentieel. Dit is het krachtigste principe in beleggen.",
    full: "Stel: je belegt €1.000 en haalt 6% rendement. Na jaar 1 heb je €1.060. In jaar 2 haal je 6% op €1.060 — dus €63,60. Elk jaar groeit de basis waarop je rendement berekent. Na 30 jaar is €1.000 uitgegroeid tot ruim €5.700 — zonder extra inleg!",
  },
  {
    emoji: "📊",
    title: "Volatiliteit",
    short: "Volatiliteit meet hoe sterk een koers op en neer gaat. Hogere volatiliteit = meer kans op grote winsten én verliezen.",
    full: "Een spaarrekening heeft nagenoeg nul volatiliteit: je saldo stijgt rustig. Een aandelenmarkt kan in één jaar 30% dalen of stijgen. Op korte termijn is dat eng, maar op lange termijn zorgt die hogere volatiliteit voor een hoger verwacht rendement. Volatiliteit is de prijs die je betaalt voor groei.",
  },
  {
    emoji: "📉",
    title: "Drawdown",
    short: "Een drawdown is de daling van een hoogste punt naar een laagste punt. Historisch herstelt de markt altijd.",
    full: "Tijdens de financiële crisis van 2008 daalde de S&P 500 met bijna 57%. Dat is een maximale drawdown van 57%. Wie in paniek verkocht, realiseerde dat verlies. Wie bleef zitten, zag de markt in 2013 al volledig herstellen — en daarna verder stijgen tot recordhoogtes.",
  },
  {
    emoji: "↩️",
    title: "Accumulating vs Distributing",
    short: "Accumulating ETF's herbeleggen dividenden automatisch. Distributing ETF's betalen dividend uit op je rekening.",
    full: "Bij een accumulating ETF (bijv. VWCE) worden dividenden automatisch herbelegd in hetzelfde fonds. Je ziet geen uitbetaling, maar je nettovermogen groeit sneller. Bij een distributing ETF (bijv. VWRL) ontvang je dividenden op je rekening. In België is dit fiscaal anders behandeld — informeer je goed.",
  },
  {
    emoji: "📅",
    title: "Maandelijks inleggen",
    short: "Door elke maand in te leggen koop je soms duur, soms goedkoop. Op lange termijn middel je dit uit (dollar-cost averaging).",
    full: "Dollar-cost averaging (DCA) betekent dat je een vast bedrag investeert op vaste momenten, ongeacht de koers. Als de markt laag staat, koop je meer. Als de markt hoog staat, koop je minder. Gemiddeld over de tijd koop je tegen een gunstiger prijs dan wanneer je alles in één keer belegt.",
  },
  {
    emoji: "🎚️",
    title: "Risicoprofiel",
    short: "Jouw risicoprofiel bepaalt welke mix van ETF's past bij jouw situatie: horizon, budget en emotionele tolerantie.",
    full: "Je risicoprofiel hangt af van drie factoren: (1) Je tijdshorizon — hoe langer je kunt wachten, hoe meer risico je kunt nemen. (2) Je financiële situatie — beleg nooit geld dat je binnenkort nodig hebt. (3) Je emotionele tolerantie — als een daling van 30% je slaap kost, is een defensiever profiel beter.",
  },
  {
    emoji: "😱",
    title: "FOMO",
    short: "Fear Of Missing Out: de neiging om impulsief te kopen omdat je bang bent de boot te missen. Dit is de grootste valkuil voor beleggers.",
    full: "FOMO zorgt ervoor dat mensen aandelen kopen op hun hoogtepunt (wanneer iedereen er over praat) en verkopen op het dieptepunt (wanneer het nieuws negatief is). Dit is precies het omgekeerde van wat je wilt doen. De cure: een vaste strategie met maandelijkse automatische inleg, zonder te kijken naar het nieuws.",
  },
];

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

const QUIZ: QuizQuestion[] = [
  {
    question: "Wat betekent TER?",
    options: ["Jaarlijkse kosten van een fonds", "Risicometing van een aandeel", "Verwacht rendement", "Looptijd van een obligatie"],
    correct: 0,
  },
  {
    question: "Wat doet een accumulating ETF?",
    options: ["Dividenden automatisch herbeleggen", "Dividenden uitbetalen op je rekening", "Rente berekenen op je inleg", "Niets met dividenden"],
    correct: 0,
  },
  {
    question: "Wat is FOMO bij beleggen?",
    options: ["Een beursstrategie voor gevorderden", "Impulsief kopen uit angst de boot te missen", "Een type ETF met hoog rendement", "Een kostenratio voor obligaties"],
    correct: 1,
  },
];

function ConceptCard({ concept }: { concept: Concept }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{concept.emoji}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{concept.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{concept.short}</p>
        </div>
      </div>
      {open && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4">{concept.full}</p>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm text-primary-600 font-medium hover:underline"
      >
        {open ? "Minder lezen ↑" : "Meer lezen →"}
      </button>
    </div>
  );
}

function Quiz() {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUIZ.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const score = answers.filter((a, i) => a === QUIZ[i].correct).length;

  const handleSelect = (qi: number, oi: number) => {
    if (submitted) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[qi] = oi;
      return next;
    });
  };

  return (
    <div className="card space-y-6">
      <h2 className="text-xl font-bold text-gray-900">🎓 Basis quiz</h2>
      <p className="text-sm text-gray-500">Test je kennis met 3 korte vragen.</p>

      {QUIZ.map((q, qi) => (
        <div key={qi} className="space-y-3">
          <p className="font-medium text-gray-800">
            {qi + 1}. {q.question}
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {q.options.map((opt, oi) => {
              const selected = answers[qi] === oi;
              const isCorrect = oi === q.correct;
              const showResult = submitted;
              return (
                <button
                  key={oi}
                  onClick={() => handleSelect(qi, oi)}
                  className={clsx(
                    "text-left text-sm px-4 py-2.5 rounded-xl border-2 transition-all",
                    showResult && isCorrect && "border-green-500 bg-green-50 text-green-800",
                    showResult && selected && !isCorrect && "border-red-400 bg-red-50 text-red-700",
                    !showResult && selected && "border-primary-500 bg-primary-50",
                    !showResult && !selected && "border-gray-200 hover:border-primary-300"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={() => setSubmitted(true)}
          disabled={answers.includes(null)}
          className={clsx(
            "btn-primary",
            answers.includes(null) && "opacity-50 cursor-not-allowed"
          )}
        >
          Bekijk resultaat
        </button>
      ) : (
        <div
          className={clsx(
            "rounded-2xl p-5 text-center space-y-1",
            score === 3 ? "bg-green-50 border border-green-200" : "bg-primary-50 border border-primary-100"
          )}
        >
          <p className="text-2xl font-bold text-gray-900">{score} van 3 goed</p>
          <p className="text-sm text-gray-600">
            {score === 3
              ? "Perfect! Jij bent klaar om te beginnen met beleggen. 🎉"
              : score === 2
              ? "Goed bezig! Lees de uitleg van de gemiste vraag nog eens na."
              : "Geen zorgen — lees de concepten nog eens door en probeer opnieuw."}
          </p>
          {score < 3 && (
            <button
              onClick={() => {
                setAnswers(Array(QUIZ.length).fill(null));
                setSubmitted(false);
              }}
              className="btn-secondary text-sm mt-3"
            >
              Opnieuw proberen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function LearnPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Leercentrum 📚</h1>
        <p className="text-gray-500">
          Begrijp de basisconcepten van beleggen — eenvoudig uitgelegd voor Belgische beginners.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {CONCEPTS.map((c) => (
          <ConceptCard key={c.title} concept={c} />
        ))}
      </div>

      <Quiz />
    </div>
  );
}
