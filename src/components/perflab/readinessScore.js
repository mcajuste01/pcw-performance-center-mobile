// Promotion Readiness Score weights and calculation
export const READINESS_WEIGHTS = {
  attendance: 0.20,
  conditioning: 0.20,
  strength: 0.15,
  fundamentals: 0.25,
  safety: 0.10,
  professionalism: 0.10,
};

export const READINESS_LEVELS = [
  { min: 0, max: 39, label: "Foundations Needed", color: "#dc2626" },
  { min: 40, max: 59, label: "Developing", color: "#f59e0b" },
  { min: 60, max: 74, label: "Ring Ready", color: "#3b82f6" },
  { min: 75, max: 89, label: "Showcase Ready", color: "#8b3dff" },
  { min: 90, max: 100, label: "PCW Performance Ready", color: "#10b981" },
];

export const getReadinessLevel = (score) =>
  READINESS_LEVELS.find((l) => score >= l.min && score <= l.max) ||
  READINESS_LEVELS[0];

export function calculateReadinessScore(components) {
  const s =
    (components.attendancePct || 0) * READINESS_WEIGHTS.attendance +
    (components.conditioningScore || 0) * READINESS_WEIGHTS.conditioning +
    (components.strengthScore || 0) * READINESS_WEIGHTS.strength +
    (components.fundamentalsScore || 0) * READINESS_WEIGHTS.fundamentals +
    (components.safetyScore || 0) * READINESS_WEIGHTS.safety +
    (components.professionalismScore || 0) *
      READINESS_WEIGHTS.professionalism;
  return Math.round(Math.min(100, Math.max(0, s)));
}

// Daily readiness from pre-workout check-in
export function calculateDailyReadiness({ sleep, energy, soreness, stress, pain }) {
  const sleepScore = ((sleep || 3) / 5) * 100;
  const energyScore = ((energy || 3) / 5) * 100;
  const sorenessScore = ((6 - (soreness || 3)) / 5) * 100;
  const stressScore = ((6 - (stress || 3)) / 5) * 100;
  const painScore = ((10 - (pain || 0)) / 10) * 100;
  return Math.round(
    (sleepScore + energyScore + sorenessScore + stressScore + painScore) / 5
  );
}

export const shouldFlag = (score, pain) =>
  score < 50 || (pain != null && pain >= 7);

// Compute component scores from raw entity data
export function computeComponentScores({
  checkIns = [],
  wrestlingMetrics = [],
  baselineTests = [],
  skillProgress = null,
  injuryCheckIns = [],
  coachNotes = [],
}) {
  const arr = (v) => (Array.isArray(v) ? v : v?.items || []);

  // Attendance: 1 check-in = ~4%, cap at 100
  const attendancePct = Math.min(100, arr(checkIns).length * 4);

  // Conditioning: avg of conditioning metrics normalized
  const condMetrics = arr(wrestlingMetrics).filter(
    (m) => m.category === "conditioning"
  );
  const conditioningScore =
    condMetrics.length > 0
      ? Math.min(
          100,
          condMetrics.reduce((s, m) => s + Math.min(100, m.value), 0) /
            condMetrics.length
        )
      : Math.min(100, (arr(baselineTests).length > 0 ? 35 : 0));

  // Strength: avg of strength metrics normalized
  const strMetrics = arr(wrestlingMetrics).filter(
    (m) => m.category === "strength"
  );
  const strengthScore =
    strMetrics.length > 0
      ? Math.min(
          100,
          strMetrics.reduce((s, m) => s + Math.min(100, m.value), 0) /
            strMetrics.length
        )
      : Math.min(100, (arr(baselineTests).length > 0 ? 35 : 0));

  // Fundamentals: coach-verified skills
  const fundamentalsScore = skillProgress?.coach_verified
    ? Math.min(100, skillProgress.coach_verified.length * 5)
    : 30;

  // Safety: fewer active injuries = higher
  const activeInjuries = arr(injuryCheckIns).filter(
    (i) => i.status === "active"
  );
  const safetyScore = Math.max(0, 100 - activeInjuries.length * 20);

  // Professionalism: fewer red flags = higher
  const redFlags = arr(coachNotes).filter((n) => n.is_red_flag);
  const professionalismScore = Math.max(0, 100 - redFlags.length * 15);

  return {
    attendancePct,
    conditioningScore,
    strengthScore,
    fundamentalsScore,
    safetyScore,
    professionalismScore,
  };
}