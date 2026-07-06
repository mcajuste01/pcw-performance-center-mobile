// Shared analytics helpers and metric metadata

export const METRIC_LABELS = {
  pushups: "Push-ups (60s)",
  squats: "Squats (60s)",
  plank_seconds: "Plank Hold (s)",
  wall_sit_seconds: "Wall Sit (s)",
  burpees: "Burpees (60s)",
  grip_strength: "Grip Strength (kg)",
  rope_runs: "Rope Runs (60s)",
  sprint_time_seconds: "Sprint Time (s)",
  mile_run_seconds: "Mile Run (s)",
  mobility_score: "Mobility (0-100)",
  flexibility_score: "Flexibility (0-100)",
  recovery_hr: "Recovery HR (bpm)",
};

// For time-based metrics, lower is better
export const LOWER_IS_BETTER = new Set([
  "sprint_time_seconds",
  "mile_run_seconds",
  "recovery_hr",
]);

export const METRIC_UNITS = {
  pushups: "reps",
  squats: "reps",
  plank_seconds: "s",
  wall_sit_seconds: "s",
  burpees: "reps",
  grip_strength: "kg",
  rope_runs: "reps",
  sprint_time_seconds: "s",
  mile_run_seconds: "s",
  mobility_score: "/100",
  flexibility_score: "/100",
  recovery_hr: "bpm",
};

export function calcImprovement(baseline, retest, metricKey) {
  if (baseline == null || retest == null) return null;
  const diff = retest - baseline;
  const pct = baseline !== 0 ? (diff / Math.abs(baseline)) * 100 : 0;
  const isImprovement = LOWER_IS_BETTER.has(metricKey) ? diff < 0 : diff > 0;
  return { diff, pct: Math.round(pct), isImprovement };
}

export function formatDateShort(d) {
  const date = new Date(d + "T00:00:00");
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function monthLabel(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function lastNMonths(n) {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return months;
}