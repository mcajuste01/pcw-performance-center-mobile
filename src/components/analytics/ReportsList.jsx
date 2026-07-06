import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChevronRight, Plus } from "lucide-react";
import { monthLabel } from "./analyticsConstants";

export default function ReportsList({ reports, traineeName, onGenerate, canGenerate }) {
  const sorted = [...reports].sort((a, b) =>
    (b.report_month || "").localeCompare(a.report_month || "")
  );

  return (
    <div className="space-y-3">
      {canGenerate && (
        <Button onClick={onGenerate} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Generate Monthly Report
        </Button>
      )}

      {sorted.length === 0 ? (
        <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
          <CardContent className="py-10 text-center">
            <FileText className="w-10 h-10 text-gray-700 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No performance reports yet</p>
            {canGenerate && (
              <p className="text-gray-600 text-xs mt-1">Generate a monthly report to track progress over time</p>
            )}
          </CardContent>
        </Card>
      ) : (
        sorted.map((r) => (
          <Card key={r.id} className="border-gray-800 pcw-card-hover" style={{ background: "#0f0f0f" }}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-white text-sm font-semibold">{monthLabel(r.report_month)}</p>
                  <p className="text-xs text-gray-500">
                    {r.period_start} → {r.period_end}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {r.readiness_score != null && (
                    <div className="text-center">
                      <p className="text-xl font-bold" style={{
                        color: r.readiness_score >= 75 ? "#10b981" : r.readiness_score >= 60 ? "#3b82f6" : "#f59e0b"
                      }}>{r.readiness_score}</p>
                      <p className="text-[9px] text-gray-600 uppercase">Readiness</p>
                    </div>
                  )}
                  {r.attendance_pct != null && (
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">{r.attendance_pct}%</p>
                      <p className="text-[9px] text-gray-600 uppercase">Attend</p>
                    </div>
                  )}
                </div>
              </div>

              {r.summary && (
                <p className="text-xs text-gray-300 mt-2 leading-relaxed">{r.summary}</p>
              )}

              {/* Score breakdown */}
              {(r.conditioning_score != null || r.strength_score != null || r.mobility_score != null) && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    { label: "Conditioning", value: r.conditioning_score, color: "#dc2626" },
                    { label: "Strength", value: r.strength_score, color: "#8b3dff" },
                    { label: "Mobility", value: r.mobility_score, color: "#10b981" },
                  ].filter((m) => m.value != null).map((m) => (
                    <div key={m.label} className="text-center p-1.5 rounded" style={{ background: "#0a0a0a" }}>
                      <p className="text-sm font-bold" style={{ color: m.color }}>{m.value}</p>
                      <p className="text-[9px] text-gray-600">{m.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {r.coach_comments && (
                <div className="mt-3 pt-2 border-t border-gray-800">
                  <p className="text-[10px] text-gray-600 uppercase mb-0.5">Coach Comments</p>
                  <p className="text-xs text-gray-300">{r.coach_comments}</p>
                </div>
              )}

              {r.goals_next_month && (
                <div className="mt-2">
                  <p className="text-[10px] text-gray-600 uppercase mb-0.5">Next Month Goals</p>
                  <p className="text-xs text-purple-300">{r.goals_next_month}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}