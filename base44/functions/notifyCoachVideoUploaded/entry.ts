import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered by entity automation when a Video record is created
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const video = body.data;
    if (!video) return Response.json({ ok: true, skipped: "no data" });

    // Get all coaches and admins
    const profilesRes = await base44.asServiceRole.entities.UserProfile.list("full_name", 500);
    const profiles = Array.isArray(profilesRes) ? profilesRes : profilesRes?.items || [];
    const coaches = profiles.filter(p => p.role === "coach" || p.role === "admin");

    // Try to get trainee name
    let traineeName = "A trainee";
    if (video.trainee_id) {
      const traineeProfiles = await base44.asServiceRole.entities.UserProfile.filter({ auth_user_id: video.trainee_id });
      const arr = Array.isArray(traineeProfiles) ? traineeProfiles : traineeProfiles?.items || [];
      if (arr[0]) traineeName = arr[0].wrestling_name || arr[0].full_name || traineeName;
    }

    await Promise.all(coaches.map(coach =>
      base44.asServiceRole.entities.Notification.create({
        user_id: coach.auth_user_id,
        type: "video_uploaded",
        title: "🎬 New Video Awaiting Feedback",
        message: `${traineeName} uploaded "${video.title || "a video"}" — ready for coach review.`,
        read: false,
        action_url: "/VideoAnalysis",
      })
    ));

    return Response.json({ ok: true, notified: coaches.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});