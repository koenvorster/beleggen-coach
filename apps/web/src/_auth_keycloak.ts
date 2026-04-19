/**
 * NextAuth + Keycloak initialisatie.
 * Dit bestand wordt ALLEEN geladen als KEYCLOAK_CLIENT_ID + KEYCLOAK_CLIENT_SECRET gezet zijn.
 * Zo voorkomt de app dat er bij elke startup OIDC discovery calls naar Keycloak gaan.
 */
import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    roles?: string[];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: true,
  trustHost: true,
  pages: {
    signIn: "/sign-in",
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false, // HTTP op localhost — zet op true in productie
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer:
        process.env.KEYCLOAK_ISSUER ??
        "http://localhost:8081/realms/beleggencoach",
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        if (account.access_token) {
          try {
            const b64 = account.access_token
              .split(".")[1]
              .replace(/-/g, "+")
              .replace(/_/g, "/");
            const payload = JSON.parse(
              Buffer.from(b64, "base64").toString("utf-8")
            ) as { realm_access?: { roles?: string[] } };
            token.roles = payload.realm_access?.roles ?? [];
          } catch {
            token.roles = [];
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.roles = token.roles as string[] | undefined;
      return session;
    },
  },
});

// Named exports voor de App Router route handler
export const GET = handlers.GET;
export const POST = handlers.POST;
