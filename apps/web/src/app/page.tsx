import Link from "next/link";
import { ArrowRight, Shield, BookOpen, TrendingUp } from "lucide-react";
import HomeWidgets from "@/components/ui/HomeWidgets";
import NudgeBanner from "@/components/coaching/NudgeBanner";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <NudgeBanner />
      {/* Hero */}
      <section className="text-center py-16 space-y-6">
        <span className="inline-block bg-primary-50 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full">
          Voor Belgische beginners 🇧🇪
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
          Beleggen zonder stress,<br />
          <span className="text-primary-500">op jouw tempo</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          We helpen je begrijpen wat beleggen is, welk ETF bij jou past en hoe je rustig een plan opbouwt — zonder moeilijk jargon.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/onboarding" className="btn-primary inline-flex items-center gap-2">
            Maak mijn persoonlijk plan <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/etfs" className="btn-secondary inline-flex items-center gap-2">
            ETF&apos;s verkennen
          </Link>
        </div>
        <p className="text-xs text-gray-400">Gratis · Geen account vereist · Geen financieel advies</p>
      </section>

      {/* Features */}
      <section className="grid sm:grid-cols-3 gap-6">
        {[
          {
            icon: BookOpen,
            title: "Leren terwijl je doet",
            desc: "Korte uitleg bij elke stap. Geen boek nodig, gewoon doen.",
          },
          {
            icon: TrendingUp,
            title: "Jouw plan in minuten",
            desc: "Vertel ons jouw doel en we tonen wat bij jou past.",
          },
          {
            icon: Shield,
            title: "Rustig beleggen",
            desc: "We helpen je gedisciplineerd blijven als de markt beweegt.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card space-y-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </section>

      {/* Widgets: leerpad banner + statistieken + tips */}
      <HomeWidgets />

      {/* CTA strip */}
      <section className="bg-primary-500 rounded-3xl p-8 sm:p-12 text-center text-white space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold">Klaar om te beginnen?</h2>
        <p className="text-primary-100">Beantwoord 4 eenvoudige vragen en zie welk plan bij jou past.</p>
        <Link href="/onboarding" className="inline-flex items-center gap-2 bg-white text-primary-600 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors">
          Start de vragenlijst <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
