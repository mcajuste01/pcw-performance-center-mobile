import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Activity, Dumbbell, HeartPulse, TrendingUp, Flame } from "lucide-react";
import { formatDateShort } from "./analyticsConstants";

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: `${color}22` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsOverview({ data }) {
  const { readinessCheckIns, baselineTests, workouts, recoverySessions } = data;

  // Readiness trend (last 14 check-ins)
  const sortedCheckIns = [...readinessCheckIns]
    .sort((a, b) => (a.check_in_date || "").localeCompare(b.check_in_date || ""))
    .slice(-14);
  const readinessData = sortedCheckIns.map((c) => ({
    date: formatDateShort(c.check_in_date),
    score: c.readiness_score || 0,
  }));
  const avgReadiness = readinessData.length > 0
    ? Math.round(readinessData.reduce((s, d) => s + d.score, 0) / readinessData.length)
    : 0;

  // Baseline improvements
  const sortedBaselines = [...baselineTests].sort((a, b) =>
    (a.test_date || "").localeCompare(b.test_date || "")
  );
  const baseline = sortedBaselines.find((t) => t.test_type === "baseline") || sortedBaselines[0];
  const retest = sortedBaselines.find((t) => t.test_type === "retest") || sortedBaselines[sortedBaselines.length - 1];
  const baselineCount = sortedBaselines.length;

  // Workout completion
  const completedWorkouts = workouts.filter((w) => w.completion_status === "completed").length;
  const workoutPct = workouts.length > 0 ? Math.round((completedWorkouts / workouts.length) * 100) : 0;

  // Recovery consistency (sessions in last 30 days)
  const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const recentRecovery = recoverySessions.filter((r) => (r.session_date || "") >= thirtyAgo).length;

  const tooltipStyle = { background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Activity} label="Avg Readiness" value={`${avgReadiness}`} sub={`${readinessData.length} check-ins`} color="#8b3dff" />
        <KpiCard icon={Dumbbell} label="Baseline Tests" value={`${baselineCount}`} sub={baseline && retest ? "baseline + retest" : "recorded"} color="#3b82f6" />
        <KpiCard icon={TrendingUp} label="Workout Completion" value={`${workoutPct}%`} sub={`${completedWorkouts}/${workouts.length} done`} color="#10b981" />
        <KpiCard icon={HeartPulse} label="Recovery (30d)" value={`${recentRecovery}`} sub="sessions logged" color="#dc2626" />
      </div>

      {/* Readiness Trend */}
      <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" /> Readiness Score Trend
            </p>
            <span className="text-xs text-gray-500">Last {readinessData.length} check-ins</span>
          </div>
          {readinessData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={readinessData}>
                <defs>
                  <linearGradient id="readyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b3dff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b3dff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} />
                <Area type="monotone" dataKey="score" stroke="#8b3dff" strokeWidth={2} fill="url(#readyGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-gray-500 text-sm">Not enough readiness check-ins yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}