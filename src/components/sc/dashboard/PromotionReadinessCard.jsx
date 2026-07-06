import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";
import { getReadinessLevel, READINESS_WEIGHTS } from "@/components/perflab/readinessScore";

const CATEGORY_META = [
  { key: "attendancePct", label: "Attendance", weight: READINESS_WEIGHTS.attendance, color: "#8b3dff" },
  { key: "conditioningScore", label: "Conditioning", weight: READINESS_WEIGHTS.conditioning, color: "#dc2626" },
  { key: "strengthScore", label: "Strength", weight: READINESS_WEIGHTS.strength, color: "#f59e0b" },
  { key: "fundamentalsScore", label: "Wrestling Fundamentals", weight: READINESS_WEIGHTS.fundamentals, color: "#10b981" },
  { key: "safetyScore", label: "Safety", weight: READINESS_WEIGHTS.safety, color: "#3b82f6" },
  { key: "professionalismScore", label: "Professionalism", weight: READINESS_WEIGHTS.professionalism, color: "#ec4899" },
];

export default function PromotionReadinessCard({ score, components }) {
  const level = getReadinessLevel(score);
  const r = 56;
  const circ = 2 * Math.PI * r;
  return (
    <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Award className="w-5 h-5" style={{ color: "#8b3dff" }} /> Promotion Readiness
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className="relative inline-flex items-center justify-center w-32 h-32">
            <svg className="w-32 h-32 -rotate-90">
              <circle cx="64" cy="64" r={r} fill="none" stroke="#1a1a1a" strokeWidth="10" />
              <circle cx="64" cy="64" r={r} fill="none" stroke={level.color} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
                style={{ transition: "stroke-dashoffset 0.5s ease" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-white">{score}</span>
              <span className="text-[10px] text-gray-500">/ 100</span>
            </div>
          </div>
          <p className="mt-2 font-bold" style={{ color: level.color }}>{level.label}</p>
        </div>
        <div className="space-y-2">
          {CATEGORY_META.map((cat) => (
            <div key={cat.key}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-gray-400">{cat.label} <span className="text-gray-600">({Math.round(cat.weight * 100)}%)</span></span>
                <span className="text-white font-medium">{components[cat.key] || 0}</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "#1a1a1a" }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, components[cat.key] || 0)}%`, background: cat.color }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}