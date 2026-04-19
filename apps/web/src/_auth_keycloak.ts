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
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: true,
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
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
});

// Named exports voor de App Router route handler
export const GET = handlers.GET;
export const POST = handlers.POST;
