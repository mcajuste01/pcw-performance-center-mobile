import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);

function calcStreak(logs) {
  const dates = new Set(logs.map((l) => l.date).filter(Boolean));
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const svc = base44.asServiceRole.entities;

    // Find all active memberships for the caller
    const myMemberships = toArray(
      await svc.AccountabilityMembership.filter({ athlete_id: caller.id, status: "active" })
    );

    if (myMemberships.length === 0) {
      return Response.json({ partners: [], groups: [] });
    }

    const groupIds = [...new Set(myMemberships.map((m) => m.group_id))];
    const groups = [];
    const seenPartners = new Set();
    const partners = [];

    for (const groupId of groupIds) {
      const group = await svc.AccountabilityGroup.get(groupId);
      const groupMembers = toArray(
        await svc.AccountabilityMembership.filter({ group_id: groupId, status: "active" })
      );

      if (group) {
        groups.push({
          id: group.id,
          name: group.name,
          type: group.type,
          memberCount: groupMembers.length,
        });
      }

      for (const member of groupMembers) {
        if (member.athlete_id === caller.id) continue;
        if (seenPartners.has(member.athlete_id)) continue;
        seenPartners.add(member.athlete_id);

        // Partner profile
        const partnerProfiles = toArray(
          await svc.UserProfile.filter({ auth_user_id: member.athlete_id })
        );
        const pp = partnerProfiles[0] || {};

        // Fallback: fetch built-in User entity for name
        let userName = "";
        try {
          const partnerUser = await svc.User.get(member.athlete_id);
          userName = partnerUser?.full_name || "";
        } catch {
          // User entity might not be accessible; fall back to membership data
        }

        // Latest baseline test
        const baselines = toArray(
          await svc.BaselineTest.filter({ trainee_id: member.athlete_id }, "-test_date", 1)
        );
        const latestBaseline = baselines[0] || null;

        // Latest readiness check-in
        const checkIns = toArray(
          await svc.ReadinessCheckIn.filter({ trainee_id: member.athlete_id }, "-check_in_date", 1)
        );
        const latestCheckIn = checkIns[0] || null;

        // Training logs (30 days) for streak
        const trainingLogs = toArray(
          await svc.TrainingLog.filter({ trainee_id: member.athlete_id }, "-date", 30)
        );

        // Fitness profile for goals/level
        const fitnessProfiles = toArray(
          await svc.FitnessProfile.filter({ trainee_id: member.athlete_id })
        );
        const fp = fitnessProfiles[0] || null;

        partners.push({
          athlete_id: member.athlete_id,
          athlete_name: pp.wrestling_name || pp.full_name || member.athlete_name || userName || "Athlete",
          avatar_url: pp.avatar_url || null,
          tier: pp.tier || "T1",
          current_level: fp?.current_level || "foundation",
          goals: pp.goals || fp?.goals || "",
          streak: calcStreak(trainingLogs),
          latest_readiness_score: latestCheckIn?.readiness_score ?? null,
          latest_check_in_date: latestCheckIn?.check_in_date || null,
          latest_check_in_sleep: latestCheckIn?.sleep ?? null,
          latest_check_in_energy: latestCheckIn?.energy ?? null,
          training_sessions_30d: trainingLogs.length,
          recent_activity: trainingLogs.slice(0, 5).map((l) => ({
            date: l.date,
            duration: l.duration_minutes || l.duration || null,
            type: l.type || l.session_type || l.activity || "Training",
            notes: l.notes || "",
          })),
          latest_baseline: latestBaseline
            ? {
                test_date: latestBaseline.test_date,
                pushups: latestBaseline.pushups,
                squats: latestBaseline.squats,
                plank_seconds: latestBaseline.plank_seconds,
              }
            : null,
          shared_groups: groupIds,
        });
      }
    }

    return Response.json({ partners, groups });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});