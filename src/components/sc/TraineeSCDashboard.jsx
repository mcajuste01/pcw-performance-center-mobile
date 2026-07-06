import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Scale } from "lucide-react";
import { toArray } from "@/components/perflab/constants";
import {
  calculateReadinessScore, computeComponentScores, calculateDailyReadiness,
} from "@/components/perflab/readinessScore";
import BodyProgressChart from "./BodyProgressChart";
import BodyStatForm from "./BodyStatForm";
import HeroVitals from "./dashboard/HeroVitals";
import TodayWorkoutCard from "./dashboard/TodayWorkoutCard";
import PromotionReadinessCard from "./dashboard/PromotionReadinessCard";
import ProgressCharts from "./dashboard/ProgressCharts";
import CoachNotesCard from "./dashboard/CoachNotesCard";
import NextBaselineCard from "./dashboard/NextBaselineCard";
import AchievementBadges from "@/components/badges/AchievementBadges";
import { getRank, getRankProgress } from "./dashboard/rankSystem";

const DAY = 86400000;

export default function TraineeSCDashboard({ user }) {
  const [statsOpen, setStatsOpen] = useState(false);
  const uid = user.id;

  const { data: plans = [] } = useQuery({ queryKey: ["sc-dash-plans", uid], queryFn: () => base44.entities.WorkoutPlan.filter({ trainee_id: uid }, "-created_date"), initialData: [] });
  const { data: logs = [] } = useQuery({ queryKey: ["sc-dash-logs", uid], queryFn: () => base44.entities.TrainingLog.filter({ trainee_id: uid }, "-date", 100), initialData: [] });
  const { data: checkIns = [] } = useQuery({ queryKey: ["sc-dash-checkins", uid], queryFn: () => base44.entities.CheckIn.filter({ trainee_id: uid }, "-check_in_date"), initialData: [] });
  const { data: readiness = [] } = useQuery({ queryKey: ["sc-dash-readiness", uid], queryFn: () => base44.entities.ReadinessCheckIn.filter({ trainee_id: uid }, "-check_in_date"), initialData: [] });
  const { data: tests = [] } = useQuery({ queryKey: ["sc-dash-tests", uid], queryFn: () => base44.entities.BaselineTest.filter({ trainee_id: uid }, "-test_date"), initialData: [] });
  const { data: metrics = [] } = useQuery({ queryKey: ["sc-dash-metrics", uid], queryFn: () => base44.entities.WrestlingMetric.filter({ trainee_id: uid }, "-test_date"), initialData: [] });
  const { data: injuries = [] } = useQuery({ queryKey: ["sc-dash-injuries", uid], queryFn: () => base44.entities.InjuryCheckIn.filter({ trainee_id: uid }, "-check_in_date"), initialData: [] });
  const { data: notes = [] } = useQuery({ queryKey: ["sc-dash-notes", uid], queryFn: () => base44.entities.CoachNote.filter({ trainee_id: uid }, "-date"), initialData: [] });
  const { data: skillProgress = [] } = useQuery({ queryKey: ["sc-dash-skills", uid], queryFn: () => base44.entities.SkillProgress.filter({ trainee_id: uid }), initialData: [] });
  const { data: userBadges = [] } = useQuery({ queryKey: ["sc-dash-badges", uid], queryFn: () => base44.entities.UserBadge.filter({ user_id: uid }), initialData: [] });

  const ciArr = toArray(checkIns);
  const logArr = toArray(logs);
  const rdArr = toArray(readiness);
  const testArr = toArray(tests);
  const metArr = toArray(metrics);
  const injArr = toArray(injuries);
  const noteArr = toArray(notes);
  const planArr = toArray(plans);
  const skillArr = toArray(skillProgress);
  const badgeArr = toArray(userBadges);

  const activePlan = planArr.find((p) => p.status === "active");

  const latestReadiness = rdArr[0];
  const recoveryScore = latestReadiness?.readiness_score != null
    ? latestReadiness.readiness_score
    : latestReadiness
      ? calculateDailyReadiness({ sleep: latestReadiness.sleep, energy: latestReadiness.energy, soreness: latestReadiness.soreness, stress: latestReadiness.stress, pain: latestReadiness.pain })
      : null;

  const streak = ciArr[0]?.streak_count || 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthCheckIns = ciArr.filter((c) => new Date(c.check_in_date || c.created_date) >= monthStart).length;
  const attendancePct = Math.min(100, Math.round((monthCheckIns / 8) * 100));

  const xp = useMemo(() => {
    const attendanceXP = ciArr.reduce((s, c) => s + (c.xp_awarded || 0), 0);
    const workoutXP = planArr.filter((p) => p.completion_status === "completed").length * 25;
    const baselineXP = testArr.length * 50;
    const badgeXP = badgeArr.length * 50;
    return attendanceXP + workoutXP + baselineXP + badgeXP;
  }, [ciArr, planArr, testArr, badgeArr]);

  const rank = getRank(xp);
  const rankProgress = getRankProgress(xp);

  const components = useMemo(() => computeComponentScores({
    checkIns: ciArr, wrestlingMetrics: metArr, baselineTests: testArr,
    skillProgress: skillArr[0], injuryCheckIns: injArr, coachNotes: noteArr,
  }), [ciArr, metArr, testArr, skillArr, injArr, noteArr]);
  const promotionScore = calculateReadinessScore(components);

  const weeklyData = useMemo(() => {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY);
      const key = d.toISOString().slice(0, 10);
      const count = logArr.filter((l) => (l.date || "").slice(0, 10) === key).length;
      out.push({ label: d.toLocaleDateString("en-US", { weekday: "short" }), sessions: count });
    }
    return out;
  }, [logArr]);

  const strengthData = useMemo(
    () => [...testArr]
      .filter((t) => t.test_date)
      .sort((a, b) => new Date(a.test_date) - new Date(b.test_date))
      .map((t) => ({
        label: new Date(t.test_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        pushups: t.pushups || 0, squats: t.squats || 0, burpees: t.burpees || 0,
      })),
    [testArr]
  );

  const conditioningData = useMemo(
    () => metArr
      .filter((m) => m.category === "conditioning" && m.test_date)
      .sort((a, b) => new Date(a.test_date) - new Date(b.test_date))
      .map((m) => ({ label: new Date(m.test_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: m.value })),
    [metArr]
  );

  const latestTest = testArr[0];
  const nextDate = latestTest?.test_date
    ? new Date(new Date(latestTest.test_date).getTime() + 30 * DAY).toISOString().slice(0, 10)
    : null;

  const achievementStats = useMemo(() => {
    const condMinutes = logArr.filter((l) => l.drill_type === "conditioning").reduce((s, l) => s + (l.duration_minutes || 0), 0);
    const grades = logArr.map((l) => l.self_grade || l.coach_grade).filter(Boolean);
    const avgScore = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
    return {
      streak, checkIns: ciArr.length,
      conditioningHours: Math.round(condMinutes / 60),
      avgScore: Math.round(avgScore),
      level: Math.floor(xp / 500) + 1,
    };
  }, [logArr, ciArr, streak, xp]);

  return (
    <div className="space-y-6">
      <HeroVitals
        recoveryScore={recoveryScore} streak={streak} xp={xp}
        rank={rank} rankProgress={rankProgress} attendancePct={attendancePct}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <TodayWorkoutCard plan={activePlan} />
          <ProgressCharts weeklyData={weeklyData} strengthData={strengthData} conditioningData={conditioningData} />
        </div>
        <div className="space-y-4">
          <PromotionReadinessCard score={promotionScore} components={components} />
          <NextBaselineCard latestTest={latestTest} nextDate={nextDate} />
          <CoachNotesCard notes={noteArr} />
        </div>
      </div>

      <AchievementBadges stats={achievementStats} />

      <div className="flex justify-end">
        <Button onClick={() => setStatsOpen(true)} variant="outline" className="border-gray-700 text-gray-300">
          <Scale className="w-4 h-4 mr-1" /> Log Body Stats
        </Button>
      </div>
      <BodyProgressChart traineeId={uid} />

      <BodyStatForm open={statsOpen} onClose={() => setStatsOpen(false)} traineeId={uid} traineeName={user.full_name} />
    </div>
  );
}