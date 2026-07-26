import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { groupType, groupName, inviteeIds } = body;

    if (!groupType || !["pair", "pod"].includes(groupType)) {
      return Response.json({ error: "groupType must be 'pair' or 'pod'" }, { status: 400 });
    }
    if (!groupName || !groupName.trim()) {
      return Response.json({ error: "groupName is required" }, { status: 400 });
    }
    if (!Array.isArray(inviteeIds) || inviteeIds.length === 0) {
      return Response.json({ error: "At least one invitee is required" }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const callerName = caller.full_name || caller.email || "";

    // Create the group
    const group = await svc.AccountabilityGroup.create({
      type: groupType,
      name: groupName.trim(),
      created_by: caller.id,
      created_by_name: callerName,
      status: "active",
    });

    // Create a membership for the creator (auto-active)
    await svc.AccountabilityMembership.create({
      group_id: group.id,
      group_name: group.name,
      athlete_id: caller.id,
      athlete_name: callerName,
      invited_by: caller.id,
      status: "active",
      joined_at: new Date().toISOString().slice(0, 10),
      guardian_consent_given: true,
    });

    // Create invited memberships for each invitee
    const memberships = [];
    for (const inviteeId of inviteeIds) {
      if (inviteeId === caller.id) continue;
      const profiles = toArray(await svc.UserProfile.filter({ auth_user_id: inviteeId }));
      const profile = profiles[0];
      const athleteName = profile?.wrestling_name || profile?.full_name || "";

      const membership = await svc.AccountabilityMembership.create({
        group_id: group.id,
        group_name: group.name,
        athlete_id: inviteeId,
        athlete_name: athleteName,
        invited_by: caller.id,
        status: "invited",
        guardian_consent_given: false,
      });
      memberships.push(membership);
    }

    return Response.json({
      group,
      memberships,
      message: `Invited ${memberships.length} athlete(s) to "${group.name}".`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});