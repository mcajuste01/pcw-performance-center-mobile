import React, { useMemo, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Activity,
  Trophy,
  ShieldCheck,
  ClipboardList,
  UserCheck,
  Save,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { toArray } from "@/components/perflab/constants";
import {
  calculateReadinessScore,
  computeComponentScores,
  calculateDailyReadiness,
  getReadinessLevel,
} from "@/components/perflab/readinessScore";
import { getRank, getRankProgress } from "@/components/sc/dashboard/rankSystem";
import { PROGRESS_LEVELS, getLevelInfo } from "@/components/perflab/constants";

const BASELINE_META = {
  none: { label: "No Baseline", color: "#6b7280" },
  pending: { label: "Pending", color: "#f59e0b" },
  completed: { label: "Completed", color: "#3b82f6" },
  approved: { label: "Approved", color: "#10b981" },
};

export default function AthleteVitalsCard({ userId, userName }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [injuries, setInjuries] = useState("");
  const [restrictions, setRestrictions] = useState("");

  // Fitness profile (baseline status, level, injuries, restrictions)
  const { data: fitnessProfile } = useQuery({
    queryKey: ["fitness-profile", userId],
    queryFn: () => base44.entities.FitnessProfile.filter({ trainee_id: userId }),
    enabled: !!userId,
  });
  const fp = toArray(fitnessProfile)[0];

  // Performance data for XP / rank / readiness
  const { data: checkIns = [] } = useQuery({
    queryKey: ["vitals-checkins", userId],
    queryFn: () => base44.entities.CheckIn.filter({ trainee_id: userId }, "-check_in_date"),
    enabled: !!userId,
    initialData: [],
  });
  const { data: readiness = [] } = useQuery({
    queryKey: ["vitals-readiness", userId],
    queryFn: () => base44.entities.ReadinessCheckIn.filter({ trainee_id: userId }, "-check_in_date"),
    enabled: !!userId,
    initialData: [],
  });
  const { data: plans = [] } = useQuery({
    queryKey: ["vitals-plans", userId],
    queryFn: () => base44.entities.WorkoutPlan.filter({ trainee_id: userId }, "-created_date"),
    enabled: !!userId,
    initialData: [],
  });
  const { data: tests = [] } = useQuery({
    queryKey: ["vitals-tests", userId],
    queryFn: () => base44.entities.BaselineTest.filter({ trainee_id: userId }, "-test_date"),
    enabled: !!userId,
    initialData: [],
  });
  const { data: metrics = [] } = useQuery({
    queryKey: ["vitals-metrics", userId],
    queryFn: () => base44.entities.WrestlingMetric.filter({ trainee_id: userId }, "-test_date"),
    enabled: !!userId,
    initialData: [],
  });
  const { data: injuriesData = [] } = useQuery({
    queryKey: ["vitals-injuries", userId],
    queryFn: () => base44.entities.InjuryCheckIn.filter({ trainee_id: userId }, "-check_in_date"),
    enabled: !!userId,
    initialData: [],
  });
  const { data: notes = [] } = useQuery({
    queryKey: ["vitals-notes", userId],
    queryFn: () => base44.entities.CoachNote.filter({ trainee_id: userId }, "-date"),
    enabled: !!userId,
    initialData: [],
  });
  const { data: skillProgress = [] } = useQuery({
    queryKey: ["vitals-skills", userId],
    queryFn: () => base44.entities.SkillProgress.filter({ trainee_id: userId }),
    enabled: !!userId,
    initialData: [],
  });
  const { data: userBadges = [] } = useQuery({
    queryKey: ["vitals-badges", userId],
    queryFn: () => base44.entities.UserBadge.filter({ user_id: userId }),
    enabled: !!userId,
    initialData: [],
  });

  const ciArr = toArray(checkIns);
  const rdArr = toArray(readiness);
  const planArr = toArray(plans);
  const testArr = toArray(tests);
  const metArr = toArray(metrics);
  const injArr = toArray(injuriesData);
  const noteArr = toArray(notes);
  const skillArr = toArray(skillProgress);
  const badgeArr = toArray(userBadges);

  // Recovery score (latest daily readiness)
  const latestReadiness = rdArr[0];
  const recoveryScore = latestReadiness?.readiness_score != null
    ? latestReadiness.readiness_score
    : latestReadiness
      ? calculateDailyReadiness({
          sleep: latestReadiness.sleep,
          energy: latestReadiness.energy,
          soreness: latestReadiness.soreness,
          stress: latestReadiness.stress,
          pain: latestReadiness.pain,
        })
      : null;

  // XP (same formula as S&C dashboard)
  const xp = useMemo(() => {
    const attendanceXP = ciArr.reduce((s, c) => s + (c.xp_awarded || 0), 0);
    const workoutXP = planArr.filter((p) => p.completion_status === "completed").length * 25;
    const baselineXP = testArr.length * 50;
    const badgeXP = badgeArr.length * 50;
    return attendanceXP + workoutXP + baselineXP + badgeXP;
  }, [ciArr, planArr, testArr, badgeArr]);

  const rank = getRank(xp);
  const rankProgress = getRankProgress(xp);

  // Promotion readiness
  const components = useMemo(
    () =>
      computeComponentScores({
        checkIns: ciArr,
        wrestlingMetrics: metArr,
        baselineTests: testArr,
        skillProgress: skillArr[0],
        injuryCheckIns: injArr,
        coachNotes: noteArr,
      }),
    [ciArr, metArr, testArr, skillArr, injArr, noteArr]
  );
  const promotionScore = calculateReadinessScore(components);
  const promoLevel = getReadinessLevel(promotionScore);

  // Coach — derive from most recent coach note name, else workout plan coach
  const coachName = useMemo(() => {
    if (noteArr[0]?.coach_name) return noteArr[0].coach_name;
    const coachId = planArr.find((p) => p.coach_id)?.coach_id;
    if (coachId) return "Assigned"; // resolved name not available without extra query
    return null;
  }, [noteArr, planArr]);

  // Sync injury/restriction fields when fitness profile loads
  useEffect(() => {
    setInjuries(fp?.injuries || "");
    setRestrictions(fp?.restrictions || "");
  }, [fp]);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      fp
        ? base44.entities.FitnessProfile.update(fp.id, data)
        : base44.entities.FitnessProfile.create({
            ...data,
            trainee_id: userId,
            trainee_name: userName,
          }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["fitness-profile", userId] });
      toast.success("Vitals updated");
      setEditing(false);
    },
    onError: (e) => toast.error("Save failed: " + e.message),
  });

  const levelInfo = getLevelInfo(fp?.current_level || "foundation");
  const baselineMeta = BASELINE_META[fp?.baseline_status || "none"];

  const rcColor = recoveryScore == null ? "#6b7280" : recoveryScore >= 70 ? "#10b981" : recoveryScore >= 50 ? "#f59e0b" : "#dc2626";

  return (
    <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Activity className="w-5 h-5" style={{ color: "#8b3dff" }} />
          Athlete Vitals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Top row: Recovery ring + Rank/XP */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Recovery Score */}
          <div className="flex items-center gap-4 rounded-lg border border-gray-800 p-4" style={{ background: "#0a0a0a" }}>
            <div className="relative inline-flex items-center justify-center w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#1a1a1a" strokeWidth="7" />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke={rcColor}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - (recoveryScore || 0) / 100)}
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-white">{recoveryScore ?? "—"}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">Daily Recovery</p>
              <p className="text-sm font-semibold" style={{ color: rcColor }}>
                {recoveryScore == null ? "No check-in" : recoveryScore >= 70 ? "Ready" : recoveryScore >= 50 ? "Moderate" : "Needs rest"}
              </p>
              <p className="text-[11px] text-gray-600 mt-1">From latest readiness check-in</p>
            </div>
          </div>

          {/* Rank + XP */}
          <div className="flex items-center gap-4 rounded-lg border border-gray-800 p-4" style={{ background: "#0a0a0a" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0" style={{ background: `${rank.color}22`, border: `2px solid ${rank.color}` }}>
              <Trophy className="w-6 h-6" style={{ color: rank.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Rank · {xp} XP</p>
              <p className="text-lg font-bold" style={{ color: rank.color }}>{rank.name}</p>
              <div className="h-1.5 rounded-full mt-1.5" style={{ background: "#1a1a1a" }}>
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${rankProgress.pct}%`, background: rank.color }} />
              </div>
              {rankProgress.next && (
                <p className="text-[11px] text-gray-600 mt-1">{rankProgress.needed - rankProgress.into} XP to {rankProgress.next.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Status badges row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <VitalBadge
            icon={ShieldCheck}
            label="Promotion"
            value={promotionScore}
            sub={promoLevel.label}
            color={promoLevel.color}
          />
          <VitalBadge
            icon={ClipboardList}
            label="Baseline"
            value={baselineMeta.label}
            sub={testArr.length ? `${testArr.length} test${testArr.length > 1 ? "s" : ""}` : "no tests"}
            color={baselineMeta.color}
          />
          <VitalBadge
            icon={UserCheck}
            label="Coach"
            value={coachName || "Not assigned"}
            sub={levelInfo.name}
            color={levelInfo.color}
          />
        </div>

        {/* Injury history + medical restrictions */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs flex items-center justify-between">
              <span>🩹 Injury History</span>
              {editing && <span className="text-gray-600 text-[10px]">Editable</span>}
            </Label>
            {editing ? (
              <Textarea
                value={injuries}
                onChange={(e) => setInjuries(e.target.value)}
                rows={3}
                placeholder="Current or past injuries..."
                className="bg-[#0a0a0a] border-gray-800 text-white"
              />
            ) : (
              <div className="rounded-md border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-100 min-h-[76px] whitespace-pre-wrap">
                {injuries || "—"}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs flex items-center justify-between">
              <span>⚠️ Medical Restrictions</span>
              {editing && <span className="text-gray-600 text-[10px]">Editable</span>}
            </Label>
            {editing ? (
              <Textarea
                value={restrictions}
                onChange={(e) => setRestrictions(e.target.value)}
                rows={3}
                placeholder="Movement or medical restrictions..."
                className="bg-[#0a0a0a] border-gray-800 text-white"
              />
            ) : (
              <div className="rounded-md border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-100 min-h-[76px] whitespace-pre-wrap">
                {restrictions || "—"}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          {editing ? (
            <div className="flex gap-2">
              <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => { setEditing(false); setInjuries(fp?.injuries || ""); setRestrictions(fp?.restrictions || ""); }}>
                Cancel
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate({ injuries, restrictions })}
              >
                <Save className="w-4 h-4 mr-1" />
                {saveMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="border-gray-700 text-gray-300" onClick={() => setEditing(true)}>
              <Pencil className="w-4 h-4 mr-1" /> Edit Injuries & Restrictions
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function VitalBadge({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rounded-lg border border-gray-800 p-3 flex items-start gap-2.5" style={{ background: "#0a0a0a" }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${color}22` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500">{label}</p>
        <p className="text-sm font-semibold truncate" style={{ color }}>{value}</p>
        <p className="text-[10px] text-gray-600 truncate">{sub}</p>
      </div>
    </div>
  );
}