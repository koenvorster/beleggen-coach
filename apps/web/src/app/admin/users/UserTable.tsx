"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserWithRoles } from "@/lib/types";
import type { AdminApiResponse } from "@/lib/types";
import RoleEditor from "./RoleEditor";

interface Props {
  initialUsers: UserWithRoles[];
}

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  user: "bg-blue-100 text-blue-700",
  advisor: "bg-green-100 text-green-700",
};

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_STYLES[role] ?? "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {role}
    </span>
  );
}

export default function UserTable({ initialUsers }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithRoles[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Weet je zeker dat je "${name}" wilt verwijderen?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const json = (await res.json()) as AdminApiResponse<null>;
      if (!json.success) {
        setError(json.error ?? "Verwijderen mislukt");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      router.refresh();
    } catch {
      setError("Netwerkfout bij verwijderen");
    }
  }

  function handleRoleSaved(userId: string, roles: string[]) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, roles } : u))
    );
    setEditingUser(null);
    router.refresh();
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table data-testid="users-table" className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Naam",
                "E-mail",
                "Gebruikersnaam",
                "Rollen",
                "Acties",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  Geen gebruikers gevonden
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                  {user.username}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.length === 0 ? (
                      <span className="text-gray-400 text-xs italic">
                        Geen rollen
                      </span>
                    ) : (
                      user.roles.map((r) => <RoleBadge key={r} role={r} />)
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2"
                    >
                      Rollen bewerken
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(
                          user.id,
                          `${user.firstName} ${user.lastName}`.trim() ||
                            user.username
                        )
                      }
                      className="text-xs text-red-600 hover:text-red-800 font-medium underline underline-offset-2"
                    >
                      Verwijderen
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <RoleEditor
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={handleRoleSaved}
        />
      )}
    </>
  );
}
