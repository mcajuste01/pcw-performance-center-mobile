import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Authenticate the caller — do not trust app_user.id from the request body
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { event, app_user } = body;

    // Determine whose context to build — default to the authenticated caller
    const targetUserId = app_user?.id || user.id;

    // If requesting another user's context, verify the caller is a coach/admin
    if (targetUserId !== user.id) {
      const isAuthAdmin = user.role === 'admin';
      let isCoach = isAuthAdmin;
      if (!isAuthAdmin) {
        const callerProfiles = await base44.entities.UserProfile.filter({ auth_user_id: user.id });
        const cp = (Array.isArray(callerProfiles) ? callerProfiles : callerProfiles?.items || [])[0];
        isCoach = cp?.role === 'coach' || cp?.role === 'admin';
      }
      if (!isCoach) {
        return Response.json({ error: 'Forbidden — can only access own context' }, { status: 403 });
      }
    }

    // Fetch the target trainee's profile
    const profileRes = await base44.asServiceRole.entities.UserProfile.filter({
      auth_user_id: targetUserId,
    });
    const profiles = Array.isArray(profileRes) ? profileRes : profileRes?.items || [];
    const profile = profiles[0];

    if (!profile) {
      return Response.json({ status: "skipped", reason: "no_profile" });
    }

    // Gather context: assignments, skills, check-ins
    const [assignRes, skillRes, checkinRes] = await Promise.all([
      base44.asServiceRole.entities.Assignment.filter({ trainee_id: targetUserId }, "due_date", 20),
      base44.asServiceRole.entities.SkillProgress.filter({ trainee_id: targetUserId }, "-last_updated", 1),
      base44.asServiceRole.entities.CheckIn.filter({ trainee_id: targetUserId }, "-check_in_date", 5),
    ]);

    const assignments = Array.isArray(assignRes) ? assignRes : assignRes?.items || [];
    const skills = Array.isArray(skillRes) ? skillRes : skillRes?.items || [];
    const checkins = Array.isArray(checkinRes) ? checkinRes : checkinRes?.items || [];

    const active = assignments.filter(a => a.status === "assigned");
    const submitted = assignments.filter(a => a.status === "submitted");
    const graded = assignments.filter(a => a.status === "graded");
    const skillRecord = skills[0];
    const verifiedCount = skillRecord?.coach_verified?.length || 0;
    const selfAssessedCount = skillRecord?.self_completed?.length || 0;
    const streak = checkins[0]?.streak_count || 0;

    const contextSummary = [
      `Trainee Context: ${profile.full_name} (Tier: ${profile.tier || "T1"})`,
      `Role: ${profile.role}. Focus areas: ${(profile.focus_areas || []).join(", ") || "general"}.`,
      `Assignments: ${active.length} active, ${submitted.length} submitted (awaiting review), ${graded.length} graded.`,
      `Skills: ${verifiedCount} coach-verified, ${selfAssessedCount} self-assessed.`,
      `Recent check-in streak: ${streak}. Total sessions logged: ${checkins.length}.`,
    ].join(" ");

    // Try to update conversation metadata with context (best-effort)
    const conversationId = event?.conversation_id || event?.id;
    if (conversationId) {
      try {
        await base44.asServiceRole.agents?.updateConversation?.(conversationId, {
          metadata: { context_summary: contextSummary },
        });
      } catch (_e) {
        // agents API may not be available on service role — context is returned instead
      }
    }

    return Response.json({
      status: "success",
      context: contextSummary,
      profile_tier: profile.tier,
      active_assignments: active.length,
      verified_skills: verifiedCount,
      streak,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});