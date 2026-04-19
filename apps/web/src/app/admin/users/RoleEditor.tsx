"use client";

import { useState } from "react";
import type { UserWithRoles } from "@/lib/types";
import type { AdminApiResponse } from "@/lib/types";

const APP_ROLES = ["admin", "user", "advisor"] as const;
type AppRole = (typeof APP_ROLES)[number];

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Beheerder (admin)",
  user: "Gebruiker (user)",
  advisor: "Adviseur (advisor)",
};

interface Props {
  user: UserWithRoles;
  onClose: () => void;
  onSaved: (userId: string, roles: string[]) => void;
}

export default function RoleEditor({ user, onClose, onSaved }: Props) {
  const [selected, setSelected] = useState<AppRole[]>(
    user.roles.filter((r): r is AppRole =>
      (APP_ROLES as readonly string[]).includes(r)
    )
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleRole(role: AppRole) {
    setSelected((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: selected }),
      });
      const json = (await res.json()) as AdminApiResponse<string[]>;
      if (!json.success) {
        setError(json.error ?? "Opslaan mislukt");
        return;
      }
      onSaved(user.id, selected);
    } catch {
      setError("Netwerkfout bij opslaan rollen");
    } finally {
      setLoading(false);
    }
  }

  const displayName =
    `${user.firstName} ${user.lastName}`.trim() || user.username;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-bold text-gray-900">Rollen bewerken</h2>
        <p className="text-sm text-gray-500 mt-1 mb-5">{displayName}</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {APP_ROLES.map((role) => (
            <label
              key={role}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(role)}
                onChange={() => toggleRole(role)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-800">{ROLE_LABELS[role]}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
          >
            {loading ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </div>
    </div>
  );
}
