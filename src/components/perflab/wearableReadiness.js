export function deriveWearableReadiness({ sleep_hours, recovery_score } = {}) {
  if (!Number.isFinite(sleep_hours) && !Number.isFinite(recovery_score)) {
    return {
      readiness_status: 'insufficient_data',
      readiness_score: null,
      coach_recommendation: 'No wearable data is available yet.',
    };
  }
  const values = [];
  if (Number.isFinite(sleep_hours)) values.push(Math.max(0, Math.min(100, (sleep_hours / 8) * 100)));
  if (Number.isFinite(recovery_score)) values.push(Math.max(0, Math.min(100, recovery_score)));
  const readiness_score = Math.round(values.reduce((total, value) => total + value, 0) / values.length);
  if (readiness_score < 50) {
    return { readiness_status: 'recovery_suggested', readiness_score, coach_recommendation: 'Consider a lighter session today.' };
  }
  if (readiness_score < 70) {
    return { readiness_status: 'monitor', readiness_score, coach_recommendation: 'Monitor recovery and adjust training if needed.' };
  }
  return { readiness_status: 'ready', readiness_score, coach_recommendation: 'Ready for planned training.' };
}
