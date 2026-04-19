"use client";
import { signIn } from "next-auth/react";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center gap-6 py-16">
      <h1 className="text-2xl font-bold text-gray-900">Account aanmaken</h1>
      <p className="text-gray-500">Maak een gratis account aan via Keycloak.</p>
      <button
        onClick={() => signIn("keycloak", { callbackUrl: "/onboarding" })}
        className="btn-primary px-8 py-3 text-base"
      >
        Account aanmaken
      </button>
    </div>
  );
}
