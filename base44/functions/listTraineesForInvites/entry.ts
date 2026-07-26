import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const svc = base44.asServiceRole.entities;

    // Fetch all trainee profiles (service role bypasses RLS)
    const profiles = toArray(await svc.UserProfile.filter({ role: "trainee" }));

    // Return minimal info needed for invites — no sensitive fields
    const trainees = profiles
      .filter((p) => p.auth_user_id && p.auth_user_id !== caller.id)
      .map((p) => ({
        auth_user_id: p.auth_user_id,
        full_name: p.full_name || "",
        wrestling_name: p.wrestling_name || "",
        avatar_url: p.avatar_url || null,
        tier: p.tier || "T1",
      }));

    return Response.json({ trainees });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});