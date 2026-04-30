"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Users, TrendingUp, Wallet, Activity } from "lucide-react";

interface PlatformStats {
  total_users: number;
  active_users_month: number;
  avg_monthly_investment_eur: number;
  avg_investment_horizon_years: number;
  top_etfs: Array<{
    isin: string;
    name: string;
    user_count: number;
  }>;
  growth_by_week?: Array<{
    week: string;
    users: number;
  }>;
}

export default function PlatformStatsClient() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/platform-stats")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setStats(result.data);
        } else {
          setError(result.error?.message || "Failed to load stats");
        }
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Transparantie</h1>
          <p className="text-gray-500 mt-2">Anonieme statistieken van de BeleggenCoach community.</p>
        </div>
        <div className="card py-12 text-center text-gray-400">
          Statistieken laden...
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Transparantie</h1>
        </div>
        <div className="card p-6 text-center text-red-600">
          ⚠️ {error || "Statistieken niet beschikbaar"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📊 Platform Transparantie</h1>
        <p className="text-gray-500 mt-2">
          Anonieme statistieken over de BeleggenCoach community en activiteit.
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-600">Totaal Gebruikers</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total_users.toLocaleString()}</p>
        </div>

        <div className="card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-gray-600">Actief deze Maand</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.active_users_month.toLocaleString()}</p>
        </div>

        <div className="card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-semibold text-gray-600">Gem. Maandelijks Investering</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">€{stats.avg_monthly_investment_eur.toLocaleString()}</p>
        </div>

        <div className="card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-semibold text-gray-600">Gem. Horizon</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.avg_investment_horizon_years.toFixed(1)} jr</p>
        </div>
      </div>

      {/* Top ETFs */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">🏆 Top 5 ETF's (naar gebruikers)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Rang</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">ETF</th>
                <th className="text-center py-3 px-3 font-semibold text-gray-700">Gebruikers</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_etfs.map((etf, idx) => (
                <tr key={etf.isin} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 text-gray-900 font-semibold">#{idx + 1}</td>
                  <td className="py-3 px-3 font-semibold text-gray-900">{etf.name}</td>
                  <td className="py-3 px-3 text-center text-gray-900">{etf.user_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Growth chart (if data available) */}
      {stats.growth_by_week && stats.growth_by_week.length > 0 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">📈 Gebruikergroei (wekelijks)</h2>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.growth_by_week}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#3b82f6"
                  dot={{ fill: "#3b82f6" }}
                  name="Totaal gebruikers"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Information */}
      <div className="card p-4 bg-blue-50 space-y-3 border border-blue-200">
        <p className="font-semibold text-blue-900">ℹ️ Over deze statistieken</p>
        <p className="text-sm text-blue-800">
          Deze anonieme statistieken tonen de gezondheid en groei van de BeleggenCoach platform. Geen persoonlijke gegevens worden gedeeld.
        </p>
      </div>
    </div>
  );
}
