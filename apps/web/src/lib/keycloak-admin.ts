const KEYCLOAK_BASE = "http://localhost:8081";
const REALM = "beleggencoach";

interface TokenCache {
  token: string;
  expiresAt: number;
}

let _tokenCache: TokenCache | null = null;

export const KEYCLOAK_ADMIN_API = `${KEYCLOAK_BASE}/admin/realms/${REALM}`;

export async function getAdminToken(): Promise<string> {
  const now = Date.now();
  if (_tokenCache && _tokenCache.expiresAt > now + 5000) {
    return _tokenCache.token;
  }
  const res = await fetch(
    `${KEYCLOAK_BASE}/realms/master/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: "admin-cli",
        username: "admin",
        password: "admin",
        grant_type: "password",
      }),
      cache: "no-store",
    }
  );
  if (!res.ok)
    throw new Error(`Keycloak admin token ophalen mislukt: ${res.status}`);
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  _tokenCache = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return _tokenCache.token;
}

export async function keycloakAdminFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAdminToken();
  return fetch(`${KEYCLOAK_ADMIN_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...((options.headers as Record<string, string> | undefined) ?? {}),
    },
    cache: "no-store",
  });
}
