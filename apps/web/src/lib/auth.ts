// Returns true only when Keycloak env vars are configured
export function isAuthEnabled(): boolean {
  return Boolean(process.env.KEYCLOAK_CLIENT_ID && process.env.KEYCLOAK_CLIENT_SECRET);
}
