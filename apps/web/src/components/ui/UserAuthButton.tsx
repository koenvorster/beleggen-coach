"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function UserAuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-sm text-gray-600 hover:text-primary-600"
      >
        {session.user?.name ?? "Account"} · Afmelden
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn("keycloak")}
      className="text-sm text-gray-600 hover:text-primary-600"
    >
      Inloggen
    </button>
  );
}
