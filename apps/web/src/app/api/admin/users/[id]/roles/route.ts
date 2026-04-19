import { NextRequest, NextResponse } from "next/server";
import { keycloakAdminFetch } from "@/lib/keycloak-admin";
import type { AdminApiResponse, KeycloakRole } from "@/lib/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const APP_ROLES = ["admin", "user", "advisor"];

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<AdminApiResponse<string[]>>> {
  try {
    const { id } = await params;
    const res = await keycloakAdminFetch(`/users/${id}/role-mappings/realm`);
    if (!res.ok) {
      return NextResponse.json({
        success: false,
        data: null,
        error: `Rollen ophalen mislukt: ${res.status}`,
      });
    }
    const roles = (await res.json()) as KeycloakRole[];
    const filtered = roles
      .map((r) => r.name)
      .filter((name) => APP_ROLES.includes(name));
    return NextResponse.json({ success: true, data: filtered, error: null });
  } catch (err) {
    return NextResponse.json({
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Onbekende fout",
    });
  }
}

interface RolesBody {
  roles: string[];
}

async function getRoleObject(name: string): Promise<KeycloakRole | null> {
  const res = await keycloakAdminFetch(`/roles/${name}`);
  if (!res.ok) return null;
  return (await res.json()) as KeycloakRole;
}

export async function POST(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<AdminApiResponse<string[]>>> {
  try {
    const { id } = await params;
    const body = (await req.json()) as RolesBody;
    const desired = body.roles.filter((r) => APP_ROLES.includes(r));

    // Get current roles
    const currentRes = await keycloakAdminFetch(
      `/users/${id}/role-mappings/realm`
    );
    const currentAll = currentRes.ok
      ? ((await currentRes.json()) as KeycloakRole[])
      : [];
    const currentAppRoles = currentAll.filter((r) => APP_ROLES.includes(r.name));
    const currentNames = currentAppRoles.map((r) => r.name);

    const toAdd = desired.filter((r) => !currentNames.includes(r));
    const toRemove = currentAppRoles.filter((r) => !desired.includes(r.name));

    // Add roles
    if (toAdd.length > 0) {
      const addObjects: KeycloakRole[] = [];
      for (const name of toAdd) {
        const role = await getRoleObject(name);
        if (role) addObjects.push(role);
      }
      if (addObjects.length > 0) {
        await keycloakAdminFetch(`/users/${id}/role-mappings/realm`, {
          method: "POST",
          body: JSON.stringify(addObjects),
        });
      }
    }

    // Remove roles
    if (toRemove.length > 0) {
      await keycloakAdminFetch(`/users/${id}/role-mappings/realm`, {
        method: "DELETE",
        body: JSON.stringify(toRemove),
      });
    }

    return NextResponse.json({ success: true, data: desired, error: null });
  } catch (err) {
    return NextResponse.json({
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Onbekende fout",
    });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<AdminApiResponse<null>>> {
  try {
    const { id } = await params;
    const body = (await req.json()) as RolesBody;
    const toRemoveNames = body.roles.filter((r) => APP_ROLES.includes(r));

    const roleObjects: KeycloakRole[] = [];
    for (const name of toRemoveNames) {
      const role = await getRoleObject(name);
      if (role) roleObjects.push(role);
    }

    if (roleObjects.length > 0) {
      const res = await keycloakAdminFetch(
        `/users/${id}/role-mappings/realm`,
        {
          method: "DELETE",
          body: JSON.stringify(roleObjects),
        }
      );
      if (!res.ok) {
        return NextResponse.json({
          success: false,
          data: null,
          error: `Rollen verwijderen mislukt: ${res.status}`,
        });
      }
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
