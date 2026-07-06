import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered by entity automation when an Assignment is updated to status="submitted"
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const assignment = body.data;
    if (!assignment) return Response.json({ ok: true, skipped: "no data" });

    // Only act when status just became "submitted"
    if (assignment.status !== "submitted") return Response.json({ ok: true, skipped: "not submitted" });

    // Get all coaches and admins
    const profilesRes = await base44.asServiceRole.entities.UserProfile.list("full_name", 500);
    const profiles = Array.isArray(profilesRes) ? profilesRes : profilesRes?.items || [];
    const coaches = profiles.filter(p => p.role === "coach" || p.role === "admin");

    const submitterName = assignment.submitted_by || "A trainee";

    await Promise.all(coaches.map(coach =>
      base44.asServiceRole.entities.Notification.create({
        user_id: coach.auth_user_id,
        type: "assignment_submitted",
        title: "📋 Assignment Submitted",
        message: `"${assignment.title}" has been submitted and is ready for grading.`,
        read: false,
        action_url: "/Assignments",
      })
    ));

    return Response.json({ ok: true, notified: coaches.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});