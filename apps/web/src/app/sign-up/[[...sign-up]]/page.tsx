import Link from "next/link";
import { SignUpButton } from "./SignUpButton";
import { signIn } from "@/auth";

async function keycloakSignUp() {
  "use server";
  await signIn("keycloak", { redirectTo: "/onboarding" });
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-700 via-emerald-600 to-blue-700 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📈</span>
          <span className="text-2xl font-bold tracking-tight">BeleggenCoach</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Begin vandaag met slim beleggen
            </h1>
            <p className="text-emerald-100 text-lg">
              Gratis. Geen financieel advies. Puur educatie op maat van jouw situatie.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              { icon: "✅", text: "Gratis account in enkele seconden" },
              { icon: "🔒", text: "Jouw data blijft van jou — veilig via Keycloak" },
              { icon: "📚", text: "Leer beleggen met begrijpelijke uitleg en simulaties" },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="text-2xl leading-tight">{icon}</span>
                <span className="text-emerald-50 text-base">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-emerald-200 text-sm">
          BeleggenCoach biedt geen financieel advies. Alle informatie is puur educatief.
        </p>
      </div>

      {/* Right signup panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-2xl">📈</span>
            <span className="text-xl font-bold text-blue-700">BeleggenCoach</span>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Begin jouw beleggingsreis</h2>
              <p className="text-slate-500 mt-1">
                Maak een gratis account aan en ontdek hoe je slim kunt beleggen
              </p>
            </div>

            <SignUpButton action={keycloakSignUp} />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-sm text-slate-400">of</span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-500">
              Al een account?{" "}
              <Link href="/sign-in" className="text-blue-600 hover:text-blue-700 font-medium">
                Log hier in
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400 px-4">
            Door je te registreren ga je akkoord met onze{" "}
            <Link href="/disclaimer" className="underline hover:text-slate-600">
              gebruiksvoorwaarden
            </Link>
            . BeleggenCoach biedt geen financieel advies.
          </p>
        </div>
      </div>
    </div>
  );
}
