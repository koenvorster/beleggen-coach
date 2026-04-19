/**
 * Auth module — delegeert naar Keycloak wanneer env vars aanwezig zijn, stubs anders.
 * Importeer altijd vanuit "@/auth", nooit rechtstreeks vanuit "_auth_keycloak".
 */
import type { Session } from "next-auth";

export type { Session };

const AUTH_CONFIGURED =
  Boolean(process.env.KEYCLOAK_CLIENT_ID) &&
  Boolean(process.env.KEYCLOAK_CLIENT_SECRET);

export async function auth(): Promise<Session | null> {
  if (!AUTH_CONFIGURED) return null;
  const { auth: realAuth } = await import("./_auth_keycloak");
  return realAuth() as Promise<Session | null>;
}

export async function signIn(
  provider?: string,
  // biome-ignore lint: NextAuth options zijn polymorf
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any
): Promise<never> {
  if (!AUTH_CONFIGURED) return undefined as never;
  const { signIn: realSignIn } = await import("./_auth_keycloak");
  return realSignIn(provider, options) as Promise<never>;
}

export async function signOut(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any
): Promise<void> {
  if (!AUTH_CONFIGURED) return;
  const { signOut: realSignOut } = await import("./_auth_keycloak");
  return realSignOut(options);
}

export const handlers = {
  GET: async (req: Request) => {
    if (!AUTH_CONFIGURED) return new Response("Auth disabled", { status: 404 });
    const { GET } = await import("./_auth_keycloak");
    return GET(req);
  },
  POST: async (req: Request) => {
    if (!AUTH_CONFIGURED) return new Response("Auth disabled", { status: 404 });
    const { POST } = await import("./_auth_keycloak");
    return POST(req);
  },
};
