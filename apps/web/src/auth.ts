import type { Session } from "next-auth";

export type { Session };

// Auth is optioneel — stubs wanneer geen provider geconfigureerd is.
// Voeg KEYCLOAK_CLIENT_ID/SECRET of NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY toe in .env.local om auth in te schakelen.

export const handlers = {
  GET: async () => new Response("Auth disabled", { status: 404 }),
  POST: async () => new Response("Auth disabled", { status: 404 }),
};

export async function auth(): Promise<Session | null> {
  return null;
}

export async function signIn(_provider?: string): Promise<void> {}

export async function signOut(): Promise<void> {}
