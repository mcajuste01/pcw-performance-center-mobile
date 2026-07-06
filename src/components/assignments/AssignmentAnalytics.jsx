import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CheckCircle, Clock, AlertTriangle, Users } from "lucide-react";

const TIERS = ["T1", "T2", "T3", "Graduated", "PCW Wrestler", "All"];

const TIER_COLORS = {
  T1: "#a78bfa",
  T2: "#f87171",
  T3: "#d1d5db",
  Graduated: "#34d399",
  "PCW Wrestler": "#fbbf24",
  All: "#60a5fa",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-700 p-3 text-xs"
      style={{ background: "#1a1a1a" }}>
      <p className="text-white font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function AssignmentAnalytics({ assignments }) {
  const now = new Date();

  // Only consider active (non-graded) assignments with a trainee_id (real submissions)
  const active = assignments.filter(a => a.status !== "graded");

  const totalActive = active.length;
  const submitted = active.filter(a => a.status === "submitted").length;
  const pending = active.filter(a => a.status === "assigned").length;
  const overdue = active.filter(a =>
    a.status === "assigned" && a.due_date && new Date(a.due_date + "T23:59:59") < now
  ).length;

  // Submission rate by tier (for assignments that have trainee_ids — i.e. individual assignments)
  const tierData = useMemo(() => {
    return TIERS.map(tier => {
      const tierAssignments = assignments.filter(a => a.tier === tier || (tier === "All" && a.tier === "All"));
      const total = tierAssignments.length;
      const sub = tierAssignments.filter(a => a.status === "submitted" || a.status === "graded").length;
      const pend = tierAssignments.filter(a => a.status === "assigned").length;
      if (total === 0) return null;
      return { tier, total, submitted: sub, pending: pend, rate: Math.round((sub / total) * 100) };
    }).filter(Boolean);
  }, [assignments]);

  if (totalActive === 0 && assignments.length === 0) return null;

  return (
    <div className="rounded-xl border space-y-5 p-5"
      style={{ background: "#0f0f0f", borderColor: "rgba(255,255,255,0.07)" }}>
      <h2 className="text-white font-bold text-base" style={{ fontFamily: "Rajdhani, sans-serif" }}>
        Assignment Analytics
      </h2>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active",    value: totalActive, color: "#60a5fa", icon: Users },
          { label: "Submitted", value: submitted,   color: "#8b3dff", icon: CheckCircle },
          { label: "Pending",   value: pending,     color: "#f59e0b", icon: Clock },
          { label: "Overdue",   value: overdue,     color: "#dc2626", icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-lg p-3 text-center"
            style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color }} />
            <p className="text-xl font-bold" style={{ fontFamily: "Rajdhani, sans-serif", color }}>{value}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Tier breakdown chart */}
      {tierData.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Submissions by Tier</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={tierData} barGap={4} barCategoryGap="30%">
              <XAxis dataKey="tier" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="submitted" name="Submitted" radius={[4, 4, 0, 0]}>
                {tierData.map(entry => (
                  <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] || "#8b3dff"} fillOpacity={0.9} />
                ))}
              </Bar>
              <Bar dataKey="pending" name="Pending" radius={[4, 4, 0, 0]} fill="rgba(255,255,255,0.08)" />
            </BarChart>
          </ResponsiveContainer>

          {/* Tier completion rows */}
          <div className="space-y-2 mt-4">
            {tierData.map(({ tier, submitted: sub, total, rate }) => (
              <div key={tier} className="flex items-center gap-3">
                <span className="text-xs font-medium w-24 flex-shrink-0"
                  style={{ color: TIER_COLORS[tier] || "#fff" }}>{tier}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${rate}%`, background: TIER_COLORS[tier] || "#8b3dff" }} />
                </div>
                <span className="text-xs text-gray-500 w-20 text-right flex-shrink-0">
                  {sub}/{total} · <span className="text-gray-300">{rate}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}