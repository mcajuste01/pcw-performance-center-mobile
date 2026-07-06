import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered by entity automation when a new Assignment is created
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const assignment = body.data;
    if (!assignment) return Response.json({ ok: true, skipped: "no data" });

    const { title, tier, trainee_id, due_date } = assignment;

    // Get all user profiles
    const profilesRes = await base44.asServiceRole.entities.UserProfile.list("full_name", 500);
    const profiles = Array.isArray(profilesRes) ? profilesRes : profilesRes?.items || [];

    // Determine target trainees
    let targets = [];
    if (trainee_id) {
      // Individual assignment
      targets = profiles.filter(p => p.auth_user_id === trainee_id);
    } else if (tier === "All") {
      targets = profiles.filter(p => p.role === "trainee");
    } else {
      targets = profiles.filter(p => p.role === "trainee" && p.tier === tier);
    }

    if (targets.length === 0) return Response.json({ ok: true, skipped: "no targets" });

    const dueLine = due_date ? ` Due: ${new Date(due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.` : "";

    // Create in-app notifications
    await Promise.all(targets.map(p =>
      base44.asServiceRole.entities.Notification.create({
        user_id: p.auth_user_id,
        type: "announcement",
        title: "📋 New Assignment Posted",
        message: `"${title}" has been assigned to you.${dueLine}`,
        read: false,
        action_url: "/Assignments",
      })
    ));

    // Send emails
    await Promise.all(targets.filter(p => p.email).map(p =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: p.email,
        subject: `New Assignment: ${title}`,
        body: `Hi ${p.wrestling_name || p.full_name || "Trainee"},\n\nA new assignment has been posted for you: "${title}".${dueLine}\n\nHead to your assignments page to get started.\n\n- PCW Academy`,
      })
    ));

    return Response.json({ ok: true, notified: targets.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});