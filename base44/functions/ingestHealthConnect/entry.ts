import { createClientFromRequest } from "npm:@base44/sdk@0.8.35";

const number = (value: unknown) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const sum = (samples: any[] = []) => samples.reduce((total, sample) => total + number(sample?.value), 0);

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const caller = await base44.auth.me();
  if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body.provider !== "health_connect" || !body.consent || !body.metrics) {
    return Response.json({ error: "A consented Health Connect payload is required" }, { status: 400 });
  }

  const metrics = body.metrics;
  const steps = number(metrics.steps);
  const sleepHours = number(metrics.sleep_hours);
  const activeCalories = number(metrics.active_calories);
  const heartRate = Number.isFinite(Number(metrics.average_heart_rate))
    ? Number(metrics.average_heart_rate)
    : null;

  const score = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        45 +
          Math.min(25, sleepHours * 3.5) +
          Math.min(20, steps / 500) +
          (heartRate ? 5 : 0) +
          Math.min(5, activeCalories / 200),
      ),
    ),
  );
  const readinessStatus =
    score >= 75 ? "ready" : score >= 55 ? "monitor" : "recovery_suggested";
  const recommendation =
    readinessStatus === "ready"
      ? "Ready for the planned session."
      : readinessStatus === "monitor"
      ? "Train as planned with coach check-in."
      : "Consider a lighter session or recovery work.";

  const svc = base44.asServiceRole.entities;

  const existing = await svc.WearableConnection.filter({
    trainee_id: caller.id,
    provider: "health_connect",
  });
  const connection = Array.isArray(existing) ? existing[0] : existing?.items?.[0];
  const connectionData = {
    trainee_id: caller.id,
    provider: "health_connect",
    status: "connected",
    coach_sharing_consent: true,
    consented_at: connection?.consented_at || new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  };
  if (connection) {
    await svc.WearableConnection.update(connection.id, connectionData);
  } else {
    await svc.WearableConnection.create(connectionData);
  }

  const today = new Date().toISOString().slice(0, 10);
  const summaries = await svc.WearableReadinessSummary.filter({
    trainee_id: caller.id,
    summary_date: today,
  });
  const summary = Array.isArray(summaries) ? summaries[0] : summaries?.items?.[0];
  const summaryData = {
    trainee_id: caller.id,
    summary_date: today,
    readiness_score: score,
    readiness_status: readinessStatus,
    coach_recommendation: recommendation,
    source: "health_connect",
    synced_at: new Date().toISOString(),
  };
  if (summary) {
    await svc.WearableReadinessSummary.update(summary.id, summaryData);
  } else {
    await svc.WearableReadinessSummary.create(summaryData);
  }

  return Response.json({
    status: "connected",
    summary: summaryData,
    recorded: { steps, sleep_hours: sleepHours, active_calories: activeCalories, average_heart_rate: heartRate },
  });
});