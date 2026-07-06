import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const question = body.question;
    const traineeId = body.trainee_id || user.id;

    if (!question) return Response.json({ error: 'Question required' }, { status: 400 });

    // If asking about another user, verify coach/admin
    if (traineeId !== user.id) {
      const requesterProfiles = await base44.asServiceRole.entities.UserProfile.filter({ auth_user_id: user.id });
      const requesterProfile = requesterProfiles[0];
      if (!requesterProfile || (requesterProfile.role !== 'coach' && requesterProfile.role !== 'admin')) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch trainee data in parallel
    const [profiles, baselineTests, readiness, metrics, plans, checkIns] = await Promise.all([
      base44.asServiceRole.entities.FitnessProfile.filter({ trainee_id: traineeId }),
      base44.asServiceRole.entities.BaselineTest.filter({ trainee_id: traineeId }, '-test_date', 5),
      base44.asServiceRole.entities.ReadinessCheckIn.filter({ trainee_id: traineeId }, '-check_in_date', 5),
      base44.asServiceRole.entities.WrestlingMetric.filter({ trainee_id: traineeId }, '-test_date', 20),
      base44.asServiceRole.entities.WorkoutPlan.filter({ trainee_id: traineeId, status: 'active' }),
      base44.asServiceRole.entities.CheckIn.filter({ trainee_id: traineeId }, '-check_in_date', 20),
    ]);

    const profile = profiles[0];

    // Build context
    let context = `TRAINEE: ${profile?.trainee_name || 'Unknown'}\n`;
    context += `EXPERIENCE: ${profile?.experience_level || 'beginner'}\n`;
    context += `CURRENT LEVEL: ${profile?.current_level || 'foundation'}\n`;
    if (profile?.goals) context += `GOALS: ${profile.goals}\n`;
    if (profile?.injuries) context += `INJURIES: ${profile.injuries}\n`;
    if (profile?.restrictions) context += `RESTRICTIONS: ${profile.restrictions}\n`;

    if (baselineTests.length > 0) {
      const latest = baselineTests[0];
      context += `\nLATEST BASELINE TEST (${latest.test_date}):\n`;
      if (latest.pushups) context += `  Push-ups (60s): ${latest.pushups}\n`;
      if (latest.squats) context += `  Squats (60s): ${latest.squats}\n`;
      if (latest.plank_seconds) context += `  Plank: ${latest.plank_seconds}s\n`;
      if (latest.wall_sit_seconds) context += `  Wall sit: ${latest.wall_sit_seconds}s\n`;
      if (latest.burpees) context += `  Burpees (60s): ${latest.burpees}\n`;
      if (latest.cardio_test) context += `  Cardio: ${latest.cardio_test}\n`;
      if (latest.mobility_notes) context += `  Mobility: ${latest.mobility_notes}\n`;
    }

    if (readiness.length > 0) {
      const latest = readiness[0];
      context += `\nREADINESS (latest - ${latest.check_in_date}): ${latest.readiness_score}/100`;
      if (latest.flagged) context += ' [FLAGGED - LIGHTER SESSION RECOMMENDED]';
      context += `\n  Sleep: ${latest.sleep}/5, Energy: ${latest.energy}/5, Soreness: ${latest.soreness}/5, Stress: ${latest.stress}/5, Pain: ${latest.pain}/10\n`;
    }

    if (metrics.length > 0) {
      context += '\nWRESTLING METRICS:\n';
      metrics.slice(0, 15).forEach(m => {
        context += `  ${m.metric_name} (${m.category}): ${m.value} ${m.unit} - ${m.test_date}\n`;
      });
    }

    if (plans.length > 0) {
      context += '\nACTIVE WORKOUT PLANS:\n';
      plans.forEach(p => {
        context += `  "${p.title}" - ${p.frequency || 'as prescribed'}, ${p.duration_weeks || 'N/A'} weeks, level: ${p.level || 'N/A'}\n`;
        if (p.exercises?.length) {
          p.exercises.forEach(ex => {
            context += `    - ${ex.name}: ${ex.sets} sets x ${ex.reps}\n`;
          });
        }
      });
    }

    context += `\nATTENDANCE: ${checkIns.length} check-ins recorded\n`;

    const prompt = `You are the PCW Performance Lab AI Coach for Platinum Championship Wrestling. You give personalized, specific training advice based on the trainee's ACTUAL data below. Don't give generic advice - reference their real numbers, scores, and progress. Keep responses concise, practical, and motivating. Use markdown formatting.

${context}

QUESTION FROM TRAINEE: ${question}

Provide specific, actionable advice based on their data above:`;

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
    });

    return Response.json({ response: llmResponse, context });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});