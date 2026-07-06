// Centralized gamification engine: computes XP and badge stats from real activity data.
import { getRank, getRankProgress } from "@/components/sc/dashboard/rankSystem";

// XP awarded per activity
export const XP_RULES = {
  checkin: { xp: 10, label: "Session Check-in", icon: "CalendarCheck", color: "#10b981" },
  readiness: { xp: 5, label: "Readiness Check-in", icon: "Activity", color: "#8b3dff" },
  workout: { xp: 25, label: "Workout Completed", icon: "Dumbbell", color: "#dc2626" },
  baseline: { xp: 50, label: "Baseline Test", icon: "ClipboardCheck", color: "#3b82f6" },
  recovery: { xp: 10, label: "Recovery Session", icon: "HeartPulse", color: "#10b981" },
  circuit: { xp: 20, label: "Conditioning Circuit", icon: "Flame", color: "#f59e0b" },
  assignment: { xp: 15, label: "Assignment Submitted", icon: "ClipboardList", color: "#8b3dff" },
  metric: { xp: 5, label: "Wrestling Metric", icon: "TrendingUp", color: "#3b82f6" },
  meal: { xp: 3, label: "Meal Logged", icon: "Apple", color: "#10b981" },
  bodystat: { xp: 5, label: "Body Stat Logged", icon: "Scale", color: "#f59e0b" },
};

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);

function computeStreak(checkIns) {
  if (!checkIns || checkIns.length === 0) return 0;
  const dates = [...new Set(checkIns.map((c) => c.check_in_date || c.check_in_time?.slice(0, 10)))]
    .filter(Boolean)
    .sort()
    .reverse();
  if (dates.length === 0) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + "T00:00:00");
    const curr = new Date(dates[i] + "T00:00:00");
    const diff = (prev - curr) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export function computeGamification(data) {
  const {
    checkIns = [],
    readinessCheckIns = [],
    workouts = [],
    baselineTests = [],
    recoverySessions = [],
    circuits = [],
    assignments = [],
    wrestlingMetrics = [],
    mealLogs = [],
    bodyStats = [],
    fitnessProfile = null,
  } = data;

  const ciArr = toArray(checkIns);
  const readyArr = toArray(readinessCheckIns);
  const woArr = toArray(workouts);
  const baseArr = toArray(baselineTests);
  const recArr = toArray(recoverySessions);
  const cirArr = toArray(circuits);
  const asgArr = toArray(assignments);
  const metArr = toArray(wrestlingMetrics);
  const mealArr = toArray(mealLogs);
  const bsArr = toArray(bodyStats);

  const completedWorkouts = woArr.filter((w) => w.completion_status === "completed").length;
  const completedCircuits = cirArr.filter((c) => c.completion_status === "completed").length;
  const submittedAssignments = asgArr.filter(
    (a) => a.submission_status === "submitted" || a.submission_status === "completed" || a.status === "submitted" || a.status === "graded"
  ).length;

  const breakdown = [
    { ...XP_RULES.checkin, count: ciArr.length },
    { ...XP_RULES.readiness, count: readyArr.length },
    { ...XP_RULES.workout, count: completedWorkouts },
    { ...XP_RULES.baseline, count: baseArr.length },
    { ...XP_RULES.recovery, count: recArr.length },
    { ...XP_RULES.circuit, count: completedCircuits },
    { ...XP_RULES.assignment, count: submittedAssignments },
    { ...XP_RULES.metric, count: metArr.length },
    { ...XP_RULES.meal, count: mealArr.length },
    { ...XP_RULES.bodystat, count: bsArr.length },
  ].map((b) => ({ ...b, xp: b.count * b.xp }));

  const xp = breakdown.reduce((s, b) => s + b.xp, 0);
  const rank = getRank(xp);
  const rankProgress = getRankProgress(xp);

  // Badge stats
  const streak = computeStreak(ciArr);
  const earlyCheckIn = ciArr.some((c) => {
    const time = c.check_in_time || "";
    return time && parseInt(time.slice(11, 13)) < 7;
  });

  // Conditioning hours from wrestling metrics (rough estimate: each metric = 30 min)
  const conditioningMetrics = metArr.filter((m) => m.category === "conditioning");
  const conditioningHours = Math.round((conditioningMetrics.length * 0.5) * 10) / 10;

  // Promo assignments
  const promoAssignments = asgArr.filter(
    (a) => a.assignment_type === "promo" && (a.status === "submitted" || a.status === "graded")
  ).length;

  // Average assignment score
  const gradedAssignments = asgArr.filter((a) => a.grade != null);
  const avgScore = gradedAssignments.length > 0
    ? gradedAssignments.reduce((s, a) => s + a.grade, 0) / gradedAssignments.length
    : 0;

  // Perfect month: 20+ check-ins this month
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthCheckIns = ciArr.filter((c) => (c.check_in_date || c.check_in_time || "").startsWith(monthPrefix)).length;
  const perfectMonth = monthCheckIns >= 20;

  // Match ready: fitness profile level >= ring_ready
  const matchReady = fitnessProfile?.current_level && ["ring_ready", "match_conditioning", "performance_athlete", "showcase_ready"].includes(fitnessProfile.current_level);

  // Level derived from XP
  const level = rankProgress.rank.order || 1;

  const stats = {
    streak,
    checkIns: ciArr.length,
    promoAssignments,
    conditioningHours,
    perfectMonth,
    matchReady,
    avgScore,
    helpedOthers: 0,
    level,
    earlyCheckIn,
  };

  return { xp, rank, rankProgress, breakdown, stats };
}