import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import RankProgression from "@/components/gamification/RankProgression";
import XPBreakdown from "@/components/gamification/XPBreakdown";
import MiniLeaderboard from "@/components/gamification/MiniLeaderboard";
import AchievementBadges from "@/components/badges/AchievementBadges";
import { computeGamification } from "@/components/gamification/gamificationEngine";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);

export default function GamificationCenter() {
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const isStaff = user?.role === "coach" || user?.role === "admin";
  const traineeId = user?.id;

  // Fetch all activity data for XP calculation
  const { data: checkIns = [] } = useQuery({
    queryKey: ["gamification-checkins", traineeId],
    queryFn: async () => toArray(await base44.entities.CheckIn.filter({ trainee_id: traineeId }, "-check_in_time", 200)),
    enabled: !!traineeId,
  });

  const { data: readinessCheckIns = [] } = useQuery({
    queryKey: ["gamification-readiness", traineeId],
    queryFn: async () => toArray(await base44.entities.ReadinessCheckIn.filter({ trainee_id: traineeId }, "-check_in_date", 100)),
    enabled: !!traineeId,
  });

  const { data: workouts = [] } = useQuery({
    queryKey: ["gamification-workouts", traineeId],
    queryFn: async () => toArray(await base44.entities.WorkoutPlan.filter({ trainee_id: traineeId }, "-created_date", 100)),
    enabled: !!traineeId,
  });

  const { data: baselineTests = [] } = useQuery({
    queryKey: ["gamification-baselines", traineeId],
    queryFn: async () => toArray(await base44.entities.BaselineTest.filter({ trainee_id: traineeId }, "-test_date", 20)),
    enabled: !!traineeId,
  });

  const { data: recoverySessions = [] } = useQuery({
    queryKey: ["gamification-recovery", traineeId],
    queryFn: async () => toArray(await base44.entities.RecoverySession.filter({ trainee_id: traineeId }, "-session_date", 100)),
    enabled: !!traineeId,
  });

  const { data: circuits = [] } = useQuery({
    queryKey: ["gamification-circuits", traineeId],
    queryFn: async () => toArray(await base44.entities.ConditioningCircuit.filter({ trainee_id: traineeId }, "-created_date", 50)),
    enabled: !!traineeId,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["gamification-assignments", traineeId],
    queryFn: async () => toArray(await base44.entities.Assignment.filter({ trainee_id: traineeId }, "-due_date", 100)),
    enabled: !!traineeId,
  });

  const { data: wrestlingMetrics = [] } = useQuery({
    queryKey: ["gamification-metrics", traineeId],
    queryFn: async () => toArray(await base44.entities.WrestlingMetric.filter({ trainee_id: traineeId }, "-test_date", 100)),
    enabled: !!traineeId,
  });

  const { data: mealLogs = [] } = useQuery({
    queryKey: ["gamification-meals", traineeId],
    queryFn: async () => toArray(await base44.entities.MealLog.filter({ trainee_id: traineeId }, "-meal_date", 200)),
    enabled: !!traineeId,
  });

  const { data: bodyStats = [] } = useQuery({
    queryKey: ["gamification-bodystats", traineeId],
    queryFn: async () => toArray(await base44.entities.BodyStat.filter({ trainee_id: traineeId }, "-date", 50)),
    enabled: !!traineeId,
  });

  const { data: fitnessProfile = null } = useQuery({
    queryKey: ["gamification-fitness", traineeId],
    queryFn: async () => {
      const res = toArray(await base44.entities.FitnessProfile.filter({ trainee_id: traineeId }));
      return res[0] || null;
    },
    enabled: !!traineeId,
  });

  // Leaderboard data — all trainees with their XP (simplified: uses check-in count as proxy for other trainees)
  const { data: allTrainees = [] } = useQuery({
    queryKey: ["gamification-leaderboard"],
    queryFn: async () => {
      const profiles = toArray(await base44.entities.UserProfile.filter({ role: "trainee" }));
      // For each trainee, fetch check-ins count as a basic XP proxy
      const withXp = await Promise.all(
        profiles.slice(0, 20).map(async (p) => {
          try {
            const ci = toArray(await base44.entities.CheckIn.filter({ trainee_id: p.auth_user_id }));
            const wo = toArray(await base44.entities.WorkoutPlan.filter({ trainee_id: p.auth_user_id }));
            const xp = ci.length * 10 + wo.filter((w) => w.completion_status === "completed").length * 25;
            return { ...p, xp };
          } catch {
            return { ...p, xp: 0 };
          }
        })
      );
      return withXp;
    },
    enabled: !!traineeId,
  });

  const gamification = useMemo(
    () =>
      computeGamification({
        checkIns,
        readinessCheckIns,
        workouts,
        baselineTests,
        recoverySessions,
        circuits,
        assignments,
        wrestlingMetrics,
        mealLogs,
        bodyStats,
        fitnessProfile,
      }),
    [checkIns, readinessCheckIns, workouts, baselineTests, recoverySessions, circuits, assignments, wrestlingMetrics, mealLogs, bodyStats, fitnessProfile]
  );

  if (!user) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <Trophy className="w-8 h-8 text-yellow-500 animate-pulse" />
      </div>
    );
  }

  const { xp, rank, rankProgress, breakdown, stats } = gamification;

  return (
    <div className="min-h-full p-4 md:p-8 overflow-auto" style={{ background: "#0a0a0a" }}>
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="text-xs text-gray-500 uppercase tracking-widest">Gamification</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
            Performance Center
          </h1>
          <p className="text-gray-500 text-sm mt-1">Earn XP, climb ranks, and unlock achievements</p>
        </div>

        {/* Rank Progression */}
        <RankProgression xp={xp} rank={rank} rankProgress={rankProgress} />

        <div className="grid md:grid-cols-2 gap-5">
          {/* XP Breakdown */}
          <XPBreakdown breakdown={breakdown} />
          {/* Mini Leaderboard */}
          <MiniLeaderboard trainees={allTrainees} currentUserId={traineeId} />
        </div>

        {/* Achievement Badges */}
        <AchievementBadges stats={stats} />
      </div>
    </div>
  );
}