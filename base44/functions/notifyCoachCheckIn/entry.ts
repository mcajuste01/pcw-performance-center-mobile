import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered by entity automation when a CheckIn record is created
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const checkIn = body.data;
    if (!checkIn) return Response.json({ ok: true, skipped: "no data" });

    // Get all coaches and admins
    const profilesRes = await base44.asServiceRole.entities.UserProfile.list("full_name", 500);
    const profiles = Array.isArray(profilesRes) ? profilesRes : profilesRes?.items || [];
    const coaches = profiles.filter(p => p.role === "coach" || p.role === "admin");

    const traineeName = checkIn.trainee_name || "A trainee";
    const sessionType = (checkIn.session_type || "session").replace(/_/g, " ");
    const date = checkIn.attendance_date || checkIn.check_in_date || "today";

    await Promise.all(coaches.map(coach =>
      base44.asServiceRole.entities.Notification.create({
        user_id: coach.auth_user_id,
        type: "check_in_pending",
        title: "✅ Attendance Needs Verification",
        message: `${traineeName} checked in for ${sessionType} on ${date} — awaiting verification.`,
        read: false,
        action_url: "/CoachDashboard",
      })
    ));

    return Response.json({ ok: true, notified: coaches.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});