import { NextRequest, NextResponse } from "next/server";
import { keycloakAdminFetch } from "@/lib/keycloak-admin";
import type { AdminApiResponse, KeycloakUser, KeycloakRole } from "@/lib/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const APP_ROLES = ["admin", "user", "advisor"];

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<AdminApiResponse<KeycloakUser & { roles: string[] }>>> {
  try {
    const { id } = await params;

    const [userRes, rolesRes] = await Promise.all([
      keycloakAdminFetch(`/users/${id}`),
      keycloakAdminFetch(`/users/${id}/role-mappings/realm`),
    ]);

    if (!userRes.ok) {
      return NextResponse.json({
        success: false,
        data: null,
        error: `Gebruiker ophalen mislukt: ${userRes.status}`,
      });
    }

    const user = (await userRes.json()) as KeycloakUser;
    const roles: string[] = rolesRes.ok
      ? ((await rolesRes.json()) as KeycloakRole[])
          .map((r) => r.name)
          .filter((name) => APP_ROLES.includes(name))
      : [];

    return NextResponse.json({
      success: true,
      data: { ...user, roles },
      error: null,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Onbekende fout",
    });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<AdminApiResponse<null>>> {
  try {
    const { id } = await params;
    const res = await keycloakAdminFetch(`/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      return NextResponse.json({
        success: false,
        data: null,
        error: `Gebruiker verwijderen mislukt: ${res.status}`,
      });
    }
    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    return NextResponse.json({
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Onbekende fout",
    });
  }
}
