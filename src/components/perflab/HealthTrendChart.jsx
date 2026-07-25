import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { toArray } from "./constants";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-700 px-3 py-2 text-xs" style={{ background: "#0a0a0a" }}>
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="font-medium" style={{ color: entry.stroke }}>
          {entry.name}: {entry.value != null ? entry.value : "—"}
        </p>
      ))}
    </div>
  );
}

export default function HealthTrendChart({ traineeId }) {
  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ["health-trend", traineeId],
    queryFn: () =>
      base44.entities.WearableReadinessSummary.filter(
        { trainee_id: traineeId },
        "-summary_date",
        7
      ),
    enabled: !!traineeId,
  });

  const chartData = toArray(summaries)
    .filter((s) => s.sleep_hours != null || s.average_heart_rate != null)
    .sort((a, b) => new Date(a.summary_date) - new Date(b.summary_date))
    .map((s) => ({
      date: new Date(s.summary_date).toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
      }),
      sleep: s.sleep_hours != null ? Number(s.sleep_hours.toFixed(1)) : null,
      heartRate: s.average_heart_rate ?? null,
    }));

  if (isLoading) {
    return (
      <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
        <CardContent className="pt-4">
          <div className="h-48 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
        <CardContent className="pt-4">
          <h4 className="font-semibold text-white flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4" style={{ color: "#8b3dff" }} />
            Weekly Health Trends
          </h4>
          <p className="text-xs text-gray-400 mt-2">
            Connect Health Connect to start tracking sleep and heart rate trends.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
      <CardContent className="pt-4">
        <h4 className="font-semibold text-white flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" style={{ color: "#8b3dff" }} />
          Weekly Health Trends
        </h4>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              stroke="#222"
            />
            <YAxis
              yAxisId="sleep"
              orientation="left"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              stroke="#222"
              label={{ value: "hrs", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 10 }}
            />
            <YAxis
              yAxisId="heart"
              orientation="right"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              stroke="#222"
              label={{ value: "bpm", angle: 90, position: "insideRight", fill: "#6b7280", fontSize: 10 }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Line
              yAxisId="sleep"
              type="monotone"
              dataKey="sleep"
              name="Sleep (hrs)"
              stroke="#8b3dff"
              strokeWidth={2}
              dot={{ fill: "#8b3dff", r: 3 }}
              connectNulls
            />
            <Line
              yAxisId="heart"
              type="monotone"
              dataKey="heartRate"
              name="Heart Rate (bpm)"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}