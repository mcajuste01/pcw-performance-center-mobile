const sum = (samples) => samples.reduce((total, sample) => total + (Number(sample?.value) || 0), 0);

export function normalizeHealthConnectDay({ steps = [], heartRate = [], sleep = [], calories = [] } = {}) {
  const heartRateValues = heartRate.map((sample) => Number(sample?.value)).filter(Number.isFinite);
  const sleepMinutes = sleep.reduce((total, sample) => {
    const value = Number(sample?.value) || 0;
    return total + (sample?.unit === 'minute' ? value : value * 60);
  }, 0);
  return {
    steps: sum(steps),
    average_heart_rate: heartRateValues.length
      ? Math.round(heartRateValues.reduce((total, value) => total + value, 0) / heartRateValues.length)
      : null,
    sleep_hours: Math.round((sleepMinutes / 60) * 10) / 10,
    active_calories: Math.round(sum(calories)),
  };
}
