import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Activity } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { RECOVERY_CATEGORIES, getCategory } from "./recoveryConstants";

function formatDate(d) {
  const date = new Date(d + "T00:00:00");
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function RecoveryTrends({ readinessChecks, recoverySessions }) {
  // Readiness trend (last 14 check-ins)
  const readinessData = useMemo(() => {
    return [...readinessChecks]
      .sort((a, b) => (a.check_in_date || "").localeCompare(b.check_in_date || ""))
      .slice(-14)
      .map((c) => ({ date: formatDate(c.check_in_date), score: c.readiness_score || 0 }));
  }, [readinessChecks]);

  // Recovery sessions by day (last 7 days)
  const sessionsData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dStr = d.toISOString().slice(0, 10);
      const count = recoverySessions.filter((s) => s.session_date === dStr).length;
      days.push({ date: formatDate(dStr), sessions: count });
    }
    return days;
  }, [recoverySessions]);

  // Sessions by category
  const categoryData = useMemo(() => {
    const map = {};
    recoverySessions.forEach((s) => {
      map[s.category] = (map[s.category] || 0) + 1;
    });
    return RECOVERY_CATEGORIES.map((c) => ({ name: c.name, count: map[c.key] || 0, color: c.color }));
  }, [recoverySessions]);

  const avgReadiness = readinessData.length > 0
    ? Math.round(readinessData.reduce((s, d) => s + d.score, 0) / readinessData.length)
    : 0;
  const totalSessions = recoverySessions.length;

  const tooltipStyle = { background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 };

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{avgReadiness}</p>
            <p className="text-[10px] text-gray-500 uppercase">Avg Readiness</p>
          </CardContent>
        </Card>
        <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{totalSessions}</p>
            <p className="text-[10px] text-gray-500 uppercase">Total Sessions</p>
          </CardContent>
        </Card>
        <Card className="border-gray-800 col-span-2 md:col-span-1" style={{ background: "#0f0f0f" }}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{readinessChecks.length}</p>
            <p className="text-[10px] text-gray-500 uppercase">Check-ins Logged</p>
          </CardContent>
        </Card>
      </div>

      {/* Readiness trend */}
      <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
        <CardContent className="p-4">
          <p className="text-white text-sm font-semibold mb-3 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-400" /> Readiness Score Trend
          </p>
          {readinessData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={readinessData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No check-ins to chart yet</p>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Sessions per day */}
        <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
          <CardContent className="p-4">
            <p className="text-white text-sm font-semibold mb-3 flex items-center gap-1">
              <Activity className="w-4 h-4 text-purple-400" /> Sessions (7 days)
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sessionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                <YAxis allowDecimals={false} stroke="#6b7280" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} />
                <Bar dataKey="sessions" fill="#8b3dff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sessions by category */}
        <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
          <CardContent className="p-4">
            <p className="text-white text-sm font-semibold mb-3 flex items-center gap-1">
              <Activity className="w-4 h-4 text-blue-400" /> By Category
            </p>
            {categoryData.some((c) => c.count > 0) ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} stroke="#6b7280" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={10} width={90} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">No sessions logged yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}