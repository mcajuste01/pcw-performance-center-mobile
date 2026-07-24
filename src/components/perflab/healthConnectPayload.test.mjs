import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHealthConnectDay } from './healthConnectPayload.js';

test('normalizes a day of Health Connect samples without exposing raw samples', () => {
  const result = normalizeHealthConnectDay({
    steps: [{ value: 3456 }],
    heartRate: [{ value: 80 }, { value: 100 }],
    sleep: [{ value: 420, unit: 'minute' }],
    calories: [{ value: 610 }],
  });
  assert.deepEqual(result, {
    steps: 3456,
    average_heart_rate: 90,
    sleep_hours: 7,
    active_calories: 610,
  });
});
