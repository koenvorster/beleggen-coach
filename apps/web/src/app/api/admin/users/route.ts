import { NextRequest, NextResponse } from "next/server";
import { keycloakAdminFetch } from "@/lib/keycloak-admin";
import type {
  AdminApiResponse,
  KeycloakUser,
  KeycloakRole,
} from "@/lib/types";

const APP_ROLES = ["admin", "user", "advisor"];

export async function GET(): Promise<
  NextResponse<AdminApiResponse<KeycloakUser[]>>
> {
  try {
    const res = await keycloakAdminFetch("/users?max=100");
    if (!res.ok) {
      return NextResponse.json({
        success: false,
        data: null,
        error: `Gebruikers ophalen mislukt: ${res.status}`,
      });
    }
    const users = (await res.json()) as KeycloakUser[];
    return NextResponse.json({ success: true, data: users, error: null });
  } catch (err) {
    return NextResponse.json({
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Onbekende fout",
    });
  }
}

interface CreateUserBody {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  roles: string[];
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<AdminApiResponse<{ id: string }>>> {
  try {
    const body = (await req.json()) as CreateUserBody;

    // 1. Create user
    const createRes = await keycloakAdminFetch("/users", {
      method: "POST",
      body: JSON.stringify({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        username: body.username,
        enabled: true,
        emailVerified: false,
      }),
    });

    if (!createRes.ok) {
      const text = await createRes.text();
      return NextResponse.json({
        success: false,
        data: null,
        error: `Gebruiker aanmaken mislukt: ${createRes.status} ${text}`,
      });
    }

    // Extract new user ID from Location header
    const location = createRes.headers.get("Location") ?? "";
    const userId = location.split("/").pop() ?? "";

    // 2. Set password
    const pwRes = await keycloakAdminFetch(
      `/users/${userId}/reset-password`,
      {
        method: "PUT",
        body: JSON.stringify({
          type: "password",
          value: body.password,
          temporary: false,
        }),
      }
    );
    if (!pwRes.ok) {
      return NextResponse.json({
        success: false,
        data: null,
        error: `Wachtwoord instellen mislukt: ${pwRes.status}`,
      });
    }

    // 3. Assign roles
    const rolesToAssign = body.roles.filter((r) => APP_ROLES.includes(r));
    if (rolesToAssign.length > 0) {
      const roleObjects: KeycloakRole[] = [];
      for (const roleName of rolesToAssign) {
        const roleRes = await keycloakAdminFetch(`/roles/${roleName}`);
        if (roleRes.ok) {
          roleObjects.push((await roleRes.json()) as KeycloakRole);
        }
      }
      if (roleObjects.length > 0) {
        await keycloakAdminFetch(`/users/${userId}/role-mappings/realm`, {
          method: "POST",
          body: JSON.stringify(roleObjects),
        });
      }
    }

    return NextResponse.json({ success: true, data: { id: userId }, error: null });
  } catch (err) {
    return NextResponse.json({
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Onbekende fout",
    });
  }
}
