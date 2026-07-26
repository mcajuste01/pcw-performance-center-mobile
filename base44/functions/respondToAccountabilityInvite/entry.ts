import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { membershipId, action, guardianConsent } = body;

    if (!membershipId) return Response.json({ error: "membershipId is required" }, { status: 400 });
    if (!["accept", "decline"].includes(action)) {
      return Response.json({ error: "action must be 'accept' or 'decline'" }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;

    // Load the membership via service role (the athlete has read RLS, but use
    // service role to be safe across edge cases)
    const membership = await svc.AccountabilityMembership.get(membershipId);
    if (!membership) return Response.json({ error: "Membership not found" }, { status: 404 });
    if (membership.athlete_id !== caller.id) {
      return Response.json({ error: "Only the invited athlete can respond to this invite" }, { status: 403 });
    }
    if (membership.status !== "invited") {
      return Response.json({ error: "This invite has already been responded to" }, { status: 400 });
    }

    if (action === "decline") {
      await svc.AccountabilityMembership.update(membershipId, { status: "declined" });
      return Response.json({ status: "declined", message: "Invitation declined." });
    }

    // Accept flow — check minor status via UserProfile.date_of_birth
    const profiles = toArray(await svc.UserProfile.filter({ auth_user_id: caller.id }));
    const profile = profiles[0];

    let isMinor = false;
    if (profile?.date_of_birth) {
      const birth = new Date(profile.date_of_birth);
      const ageMs = Date.now() - birth.getTime();
      const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
      isMinor = ageYears < 18;
    }

    if (isMinor && !guardianConsent) {
      return Response.json(
        {
          error: "Guardian consent is required before joining.",
          requiresGuardianConsent: true,
          isMinor: true,
        },
        { status: 403 }
      );
    }

    await svc.AccountabilityMembership.update(membershipId, {
      status: "active",
      joined_at: new Date().toISOString().slice(0, 10),
      guardian_consent_given: isMinor ? true : false,
    });

    return Response.json({ status: "active", message: "You've joined the accountability group!" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});