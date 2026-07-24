import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveWearableReadiness } from './wearableReadiness.js';

test('returns insufficient data when no wearable summaries exist', () => {
  assert.deepEqual(deriveWearableReadiness({}), {
    readiness_status: 'insufficient_data',
    readiness_score: null,
    coach_recommendation: 'No wearable data is available yet.',
  });
});

test('returns a recovery recommendation for low sleep and recovery', () => {
  const result = deriveWearableReadiness({ sleep_hours: 5, recovery_score: 35 });
  assert.equal(result.readiness_status, 'recovery_suggested');
  assert.equal(result.coach_recommendation, 'Consider a lighter session today.');
});
