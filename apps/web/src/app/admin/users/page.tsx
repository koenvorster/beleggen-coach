import { keycloakAdminFetch } from "@/lib/keycloak-admin";
import type { KeycloakUser, KeycloakRole, UserWithRoles } from "@/lib/types";
import NewUserModal from "./NewUserModal";
import UserTable from "./UserTable";

export const dynamic = "force-dynamic";

const APP_ROLES = ["admin", "user", "advisor"];

export default async function AdminUsersPage() {
  let users: UserWithRoles[] = [];
  let fetchError: string | null = null;

  try {
    const usersRes = await keycloakAdminFetch("/users?max=100");
    if (!usersRes.ok) {
      fetchError = `Gebruikers ophalen mislukt: ${usersRes.status}`;
    } else {
      const rawUsers = (await usersRes.json()) as KeycloakUser[];

      users = await Promise.all(
        rawUsers.map(async (user) => {
          try {
            const rolesRes = await keycloakAdminFetch(
              `/users/${user.id}/role-mappings/realm`
            );
            const roles: string[] = rolesRes.ok
              ? ((await rolesRes.json()) as KeycloakRole[])
                  .map((r) => r.name)
                  .filter((name) => APP_ROLES.includes(name))
              : [];
            return { ...user, roles };
          } catch {
            return { ...user, roles: [] };
          }
        })
      );
    }
  } catch (err) {
    fetchError =
      err instanceof Error ? err.message : "Verbinding met Keycloak mislukt";
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gebruikersbeheer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {users.length} gebruiker(s)
          </p>
        </div>
        <NewUserModal />
      </div>

      {fetchError ? (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {fetchError}
        </div>
      ) : (
        <UserTable initialUsers={users} />
      )}
    </div>
  );
}
