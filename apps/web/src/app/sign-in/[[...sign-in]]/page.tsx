import Link from "next/link";
import { SignInButton } from "./SignInButton";
import { signIn } from "@/auth";

async function keycloakSignIn() {
  "use server";
  await signIn("keycloak", { redirectTo: "/dashboard" });
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📈</span>
          <span className="text-2xl font-bold tracking-tight">BeleggenCoach</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Jouw AI-beleggingscoach voor een slimmer financieel begin
            </h1>
            <p className="text-blue-100 text-lg">
              Geen jargon, geen verborgen advies — puur educatie op maat.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              { icon: "📊", text: "Vergelijk ETF's op maat van jouw profiel" },
              { icon: "🎯", text: "Stel een realistisch beleggingsplan op" },
              { icon: "🧠", text: "Gedragscoaching om impulsief handelen te voorkomen" },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="text-2xl leading-tight">{icon}</span>
                <span className="text-blue-50 text-base">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-blue-200 text-sm">
          BeleggenCoach biedt geen financieel advies. Alle informatie is puur educatief.
        </p>
      </div>

      {/* Right login panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-2xl">📈</span>
            <span className="text-xl font-bold text-blue-700">BeleggenCoach</span>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Welkom terug</h2>
              <p className="text-slate-500 mt-1">
                Log in om verder te gaan met jouw beleggingsplan
              </p>
            </div>

            <SignInButton action={keycloakSignIn} />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-sm text-slate-400">of</span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-500">
              Nog geen account?{" "}
              <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 font-medium">
                Registreer je gratis
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400 px-4">
            BeleggenCoach biedt geen financieel advies. Alle informatie is uitsluitend educatief van aard.
          </p>
        </div>
      </div>
    </div>
  );
}
