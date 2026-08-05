import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ShieldCheck, ShieldAlert, AlertTriangle, Search, ExternalLink, RefreshCw, Globe } from "lucide-react";
import { Reveal, Badge, riskTone } from "../components/Shared.jsx";
import { api, ApiError } from "../lib/api.js";

const COLORS = { high: "#EF4444", moderate: "#F59E0B", low: "#22C55E" };

function StatCard({ label, value, icon: Icon, tone }) {
  const toneBg = { danger: "bg-red-50", warning: "bg-amber-50", success: "bg-green-50", accent: "bg-blue-50" }[tone];
  const toneText = { danger: "text-danger", warning: "text-warning", success: "text-success", accent: "text-accent" }[tone];
  return (
    <div className="rounded-[20px] p-6 bg-white border border-border">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-sub">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${toneBg}`}>
          <Icon size={16} className={toneText} />
        </div>
      </div>
      <p className="mt-3 text-[30px] font-bold text-text tabular-nums">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState({ items: [], total: 0 });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async (q = "") => {
    setLoading(true);
    setError(null);
    try {
      const [s, h] = await Promise.all([api.stats(), api.history({ limit: 50, q })]);
      setStats(s);
      setHistory(h);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pieData = stats
    ? [
        { name: "High risk", value: stats.risk_distribution.high, color: COLORS.high },
        { name: "Moderate risk", value: stats.risk_distribution.moderate, color: COLORS.moderate },
        { name: "Low risk", value: stats.risk_distribution.low, color: COLORS.low },
      ]
    : [];

  const barData = stats
    ? [
        { name: "High", count: stats.risk_distribution.high },
        { name: "Moderate", count: stats.risk_distribution.moderate },
        { name: "Low", count: stats.risk_distribution.low },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-[26px] font-bold text-text">Dashboard</h1>
          <p className="text-[14px] text-sub mt-1">Live data from every scan this API has run.</p>
        </div>
        <button onClick={() => load(query)} className="flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold text-text border border-border bg-white hover:bg-hoverbg transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-8 rounded-[16px] p-5 bg-red-50 border border-red-100 flex items-start gap-3">
          <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] font-semibold text-text">Couldn't load dashboard data</p>
            <p className="text-[13px] text-sub mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {!error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <StatCard label="Total Scans" value={loading ? "—" : stats?.total_scans ?? 0} icon={Globe} tone="accent" />
            <StatCard label="Threats Blocked" value={loading ? "—" : stats?.threats_blocked ?? 0} icon={ShieldAlert} tone="danger" />
            <StatCard label="Safe Sites" value={loading ? "—" : stats?.safe_sites ?? 0} icon={ShieldCheck} tone="success" />
            <StatCard label="Moderate Risk" value={loading ? "—" : stats?.moderate_risk ?? 0} icon={AlertTriangle} tone="warning" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <Reveal>
              <div className="rounded-[20px] p-6 bg-white border border-border h-[320px]">
                <h3 className="text-[14px] font-semibold text-text mb-4">Risk distribution</h3>
                {stats && stats.total_scans > 0 ? (
                  <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="rounded-[20px] p-6 bg-white border border-border h-[320px]">
                <h3 className="text-[14px] font-semibold text-text mb-4">Scans by risk level</h3>
                {stats && stats.total_scans > 0 ? (
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {barData.map((d, i) => <Cell key={i} fill={[COLORS.high, COLORS.moderate, COLORS.low][i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </div>
            </Reveal>
          </div>

          <div className="rounded-[20px] bg-white border border-border overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-border">
              <h3 className="text-[14px] font-semibold text-text">Recent scans</h3>
              <div className="flex items-center gap-2 rounded-[10px] px-3 py-2 bg-bg2 border border-border w-full sm:w-64">
                <Search size={14} className="text-sub shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load(query)}
                  placeholder="Search history…"
                  className="w-full bg-transparent text-[13px] outline-none text-text"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-[13.5px] text-sub">Loading…</div>
            ) : history.items.length === 0 ? (
              <div className="p-10 text-center text-[13.5px] text-sub">No scans yet — run one from the landing page.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13.5px]">
                  <thead>
                    <tr className="bg-bg2 text-left">
                      <th className="px-5 py-3 font-medium text-sub">URL</th>
                      <th className="px-5 py-3 font-medium text-sub">Score</th>
                      <th className="px-5 py-3 font-medium text-sub">Risk</th>
                      <th className="px-5 py-3 font-medium text-sub">Scanned</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.items.map((row) => (
                      <tr key={row.id} className="border-t border-border hover:bg-hoverbg transition-colors cursor-pointer" onClick={() => navigate(`/scan/${row.id}`)}>
                        <td className="px-5 py-3.5 text-text max-w-[280px] truncate">{row.url}</td>
                        <td className="px-5 py-3.5 tabular-nums text-text">{row.score}</td>
                        <td className="px-5 py-3.5"><Badge tone={riskTone(row.label)}>{row.label}</Badge></td>
                        <td className="px-5 py-3.5 text-sub">{new Date(row.created_at * 1000).toLocaleString()}</td>
                        <td className="px-5 py-3.5"><ExternalLink size={14} className="text-sub" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyChart() {
  return <div className="h-full flex items-center justify-center text-[13px] text-sub">Run a scan to see data here.</div>;
}
