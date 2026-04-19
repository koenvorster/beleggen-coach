"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminApiResponse } from "@/lib/types";

const APP_ROLES = ["admin", "user", "advisor"] as const;
type AppRole = (typeof APP_ROLES)[number];

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Beheerder (admin)",
  user: "Gebruiker (user)",
  advisor: "Adviseur (advisor)",
};

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  roles: AppRole[];
}

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  password: "",
  roles: [],
};

export default function NewUserModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleRole(role: AppRole) {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  }

  function handleClose() {
    setOpen(false);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as AdminApiResponse<{ id: string }>;
      if (!json.success) {
        setError(json.error ?? "Aanmaken mislukt");
        return;
      }
      handleClose();
      router.refresh();
    } catch {
      setError("Netwerkfout bij aanmaken gebruiker");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary text-sm py-2 px-4"
      >
        + Nieuwe gebruiker
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Nieuwe gebruiker aanmaken
            </h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Voornaam
                  </label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, firstName: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Achternaam
                  </label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, lastName: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  E-mailadres
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Gebruikersnaam
                </label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, username: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Wachtwoord
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Rollen
                </p>
                <div className="space-y-2">
                  {APP_ROLES.map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.roles.includes(role)}
                        onChange={() => toggleRole(role)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {ROLE_LABELS[role]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
                >
                  {loading ? "Aanmaken..." : "Aanmaken"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
