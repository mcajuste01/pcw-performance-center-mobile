import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, TrendingUp } from "lucide-react";
import {
  calculateReadinessScore,
  getReadinessLevel,
  computeComponentScores,
  READINESS_WEIGHTS,
} from "./readinessScore";
import { toArray } from "./constants";

const CATEGORY_META = [
  { key: "attendancePct", label: "Attendance", weight: READINESS_WEIGHTS.attendance, color: "#8b3dff" },
  { key: "conditioningScore", label: "Conditioning", weight: READINESS_WEIGHTS.conditioning, color: "#dc2626" },
  { key: "strengthScore", label: "Strength", weight: READINESS_WEIGHTS.strength, color: "#f59e0b" },
  { key: "fundamentalsScore", label: "Wrestling Fundamentals", weight: READINESS_WEIGHTS.fundamentals, color: "#10b981" },
  { key: "safetyScore", label: "Safety", weight: READINESS_WEIGHTS.safety, color: "#3b82f6" },
  { key: "professionalismScore", label: "Professionalism", weight: READINESS_WEIGHTS.professionalism, color: "#ec4899" },
];

export default function PromotionScoreSection({ traineeId }) {
  const { data: checkIns } = useQuery({
    queryKey: ["perf-checkins", traineeId],
    queryFn: () => base44.entities.CheckIn.filter({ trainee_id: traineeId }),
    enabled: !!traineeId,
  });
  const { data: metrics } = useQuery({
    queryKey: ["perf-metrics", traineeId],
    queryFn: () => base44.entities.WrestlingMetric.filter({ trainee_id: traineeId }),
    enabled: !!traineeId,
  });
  const { data: tests } = useQuery({
    queryKey: ["perf-tests", traineeId],
    queryFn: () => base44.entities.BaselineTest.filter({ trainee_id: traineeId }),
    enabled: !!traineeId,
  });
  const { data: skillProgress } = useQuery({
    queryKey: ["perf-skills", traineeId],
    queryFn: () => base44.entities.SkillProgress.filter({ trainee_id: traineeId }),
    enabled: !!traineeId,
  });
  const { data: injuries } = useQuery({
    queryKey: ["perf-injuries", traineeId],
    queryFn: () => base44.entities.InjuryCheckIn.filter({ trainee_id: traineeId }),
    enabled: !!traineeId,
  });
  const { data: notes } = useQuery({
    queryKey: ["perf-notes", traineeId],
    queryFn: () => base44.entities.CoachNote.filter({ trainee_id: traineeId }),
    enabled: !!traineeId,
  });

  const components = useMemo(
    () =>
      computeComponentScores({
        checkIns,
        wrestlingMetrics: metrics,
        baselineTests: tests,
        skillProgress: toArray(skillProgress)[0],
        injuryCheckIns: injuries,
        coachNotes: notes,
      }),
    [checkIns, metrics, tests, skillProgress, injuries, notes]
  );

  const score = calculateReadinessScore(components);
  const level = getReadinessLevel(score);

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold flex items-center gap-2">
        <Award className="w-5 h-5" style={{ color: "#8b3dff" }} />
        PCW Readiness Score
      </h3>

      <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            <div className="relative inline-flex items-center justify-center w-32 h-32">
              <svg className="w-32 h-32 -rotate-90">
                <circle cx="64" cy="64" r="56" fill="none" stroke="#1a1a1a" strokeWidth="10" />
                <circle
                  cx="64" cy="64" r="56" fill="none" stroke={level.color} strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{score}</span>
                <span className="text-[10px] text-gray-500">/ 100</span>
              </div>
            </div>
            <p className="mt-2 font-bold" style={{ color: level.color }}>
              {level.label}
            </p>
          </div>
          <div className="space-y-2">
            {CATEGORY_META.map((cat) => (
              <div key={cat.key}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-400">
                    {cat.label} <span className="text-gray-600">({Math.round(cat.weight * 100)}%)</span>
                  </span>
                  <span className="text-white font-medium">{components[cat.key] || 0}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: "#1a1a1a" }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, components[cat.key] || 0)}%`,
                      background: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}