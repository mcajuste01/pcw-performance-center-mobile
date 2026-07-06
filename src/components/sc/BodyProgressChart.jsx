import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Scale } from "lucide-react";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);

const METRICS = [
  { key: "weight", label: "Weight (lbs)", color: "#8b3dff" },
  { key: "body_fat_percent", label: "Body Fat (%)", color: "#dc2626" },
  { key: "waist", label: "Waist (in)", color: "#10b981" },
  { key: "chest", label: "Chest (in)", color: "#f59e0b" },
  { key: "arm", label: "Arm (in)", color: "#3b82f6" },
  { key: "thigh", label: "Thigh (in)", color: "#ec4899" },
];

export default function BodyProgressChart({ traineeId, compact = false }) {
  const [metric, setMetric] = useState("weight");

  const { data: stats = [] } = useQuery({
    queryKey: ["body-stats", traineeId],
    queryFn: () =>
      base44.entities.BodyStat.filter({ trainee_id: traineeId }, "date", 100),
    enabled: !!traineeId,
    initialData: [],
  });

  const sorted = useMemo(
    () =>
      [...toArray(stats)].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [stats]
  );

  const chartData = useMemo(
    () =>
      sorted
        .map((s) => ({
          date: new Date(s.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          [metric]: s[metric],
        }))
        .filter((d) => d[metric] != null),
    [sorted, metric]
  );

  const delta = useMemo(() => {
    if (chartData.length < 2) return null;
    return (
      chartData[chartData.length - 1][metric] - chartData[0][metric]
    );
  }, [chartData, metric]);

  const activeMetric = METRICS.find((m) => m.key === metric);

  return (
    <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: "#8b3dff" }} />
          Body Progress
        </CardTitle>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          className="text-xs rounded-md border border-gray-800 bg-[#0a0a0a] text-gray-300 px-2 py-1"
        >
          {METRICS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardContent>
        {chartData.length >= 2 ? (
          <>
            <div className="flex items-center gap-3 mb-3 text-sm">
              <span className="text-gray-400">
                Current:{" "}
                <span className="text-white font-semibold">
                  {chartData[chartData.length - 1][metric]}
                </span>
              </span>
              {delta != null && (
                <span
                  className="flex items-center gap-1"
                  style={{ color: delta > 0 ? "#f59e0b" : "#10b981" }}
                >
                  {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)} since
                  start
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={compact ? 180 : 240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0a0a0a",
                    border: "1px solid #2a2a2a",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#9ca3af" }}
                />
                <Line
                  type="monotone"
                  dataKey={metric}
                  name={activeMetric.label}
                  stroke={activeMetric.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: activeMetric.color }}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="text-center py-8">
            <Scale className="w-10 h-10 mx-auto mb-3 text-gray-700" />
            <p className="text-gray-500 text-sm">
              Log at least 2 body stat entries to see progress.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}