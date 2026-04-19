"use client";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center gap-6 py-16">
      <h1 className="text-2xl font-bold text-gray-900">Inloggen</h1>
      <p className="text-gray-500">Log in met je BeleggenCoach account.</p>
      <button
        onClick={() => signIn("keycloak", { callbackUrl: "/dashboard" })}
        className="btn-primary px-8 py-3 text-base"
      >
        Inloggen via Keycloak
      </button>
    </div>
  );
}
