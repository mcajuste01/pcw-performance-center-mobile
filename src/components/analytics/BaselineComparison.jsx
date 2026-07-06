import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { ArrowUp, ArrowDown, Minus, Trophy } from "lucide-react";
import { METRIC_LABELS, METRIC_UNITS, calcImprovement, LOWER_IS_BETTER } from "./analyticsConstants";

export default function BaselineComparison({ baselineTests }) {
  if (!baselineTests || baselineTests.length === 0) {
    return (
      <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
        <CardContent className="py-10 text-center">
          <Trophy className="w-10 h-10 text-gray-700 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No baseline tests recorded yet</p>
          <p className="text-gray-600 text-xs mt-1">Complete a baseline test in the Performance Lab to see progress</p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...baselineTests].sort((a, b) =>
    (a.test_date || "").localeCompare(b.test_date || "")
  );
  const baseline = sorted.find((t) => t.test_type === "baseline") || sorted[0];
  const retest = sorted.find((t) => t.test_type === "retest") || sorted[sorted.length - 1];

  if (!baseline) return null;
  const isSame = baseline.id === retest.id;

  const metrics = Object.keys(METRIC_LABELS).filter((k) => baseline[k] != null || retest[k] != null);

  const chartData = metrics.map((k) => {
    const imp = calcImprovement(baseline[k], retest[k], k);
    return {
      metric: METRIC_LABELS[k].replace(/\s*\(.*\)/, ""),
      baseline: baseline[k] || 0,
      retest: retest[k] || 0,
      improvement: imp,
      key: k,
    };
  });

  const tooltipStyle = { background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 };

  return (
    <div className="space-y-4">
      {/* Chart */}
      {!isSame && chartData.length > 0 && (
        <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
          <CardContent className="p-4">
            <p className="text-white text-sm font-semibold mb-3">Baseline vs Retest</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="metric" stroke="#6b7280" fontSize={10} angle={-35} textAnchor="end" height={70} interval={0} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} />
                <Bar dataKey="baseline" fill="#6b7280" radius={[4, 4, 0, 0]} name="Baseline" />
                <Bar dataKey="retest" fill="#8b3dff" radius={[4, 4, 0, 0]} name="Retest" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Metric-by-metric breakdown */}
      <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
        <CardContent className="p-4">
          <p className="text-white text-sm font-semibold mb-3">Metric Breakdown</p>
          <div className="space-y-2">
            {chartData.map((m) => {
              const imp = m.improvement;
              const lowerBetter = LOWER_IS_BETTER.has(m.key);
              const Icon = !imp || imp.diff === 0 ? Minus : imp.isImprovement ? ArrowUp : ArrowDown;
              const color = !imp || imp.diff === 0 ? "#6b7280" : imp.isImprovement ? "#10b981" : "#dc2626";
              return (
                <div key={m.key} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: "#0a0a0a" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{METRIC_LABELS[m.key]}</p>
                    <p className="text-xs text-gray-500">
                      <span className="text-gray-400">{m.baseline}</span>
                      <span className="text-gray-600 mx-1">→</span>
                      <span className="text-white font-medium">{m.retest}</span>
                      <span className="text-gray-600 ml-1">{METRIC_UNITS[m.key]}</span>
                    </p>
                  </div>
                  {imp && imp.diff !== 0 ? (
                    <div className="flex items-center gap-1 shrink-0" style={{ color }}>
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">
                        {imp.diff > 0 ? "+" : ""}{imp.diff}
                        <span className="text-gray-600 ml-0.5">({imp.pct}%)</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600 shrink-0">No change</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}