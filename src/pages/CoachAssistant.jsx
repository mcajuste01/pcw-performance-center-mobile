import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AgentChat from "@/components/ai/AgentChat";

const toArray = (v) => Array.isArray(v) ? v : (v?.items || []);

export default function CoachAssistant() {
  const [contextMessage, setContextMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;

        const profiles = toArray(await base44.entities.UserProfile.filter({ auth_user_id: user.id }));
        const profile = profiles[0];
        if (!profile || cancelled) return;

        const [assignRes, skillRes, checkinRes] = await Promise.all([
          base44.entities.Assignment.filter({ trainee_id: user.id }, "due_date", 20),
          base44.entities.SkillProgress.filter({ trainee_id: user.id }, "-last_updated", 1),
          base44.entities.CheckIn.filter({ trainee_id: user.id }, "-check_in_date", 5),
        ]);

        if (cancelled) return;

        const assignments = toArray(assignRes);
        const skills = toArray(skillRes);
        const checkins = toArray(checkinRes);

        const active = assignments.filter(a => a.status === "assigned");
        const submitted = assignments.filter(a => a.status === "submitted");
        const graded = assignments.filter(a => a.status === "graded");
        const skillRecord = skills[0];
        const verifiedCount = skillRecord?.coach_verified?.length || 0;
        const streak = checkins[0]?.streak_count || 0;

        const parts = [
          `[Context — the following is your trainee profile for this conversation]`,
          `Name: ${profile.full_name}. Tier: ${profile.tier || "T1"}. Role: ${profile.role}.`,
        ];
        if (profile.focus_areas?.length) parts.push(`Focus areas: ${profile.focus_areas.join(", ")}.`);
        parts.push(
          `Current assignments: ${active.length} active, ${submitted.length} submitted (awaiting coach review), ${graded.length} graded.`,
          `Skills: ${verifiedCount} coach-verified.`,
          `Recent check-in streak: ${streak}. Total recent sessions logged: ${checkins.length}.`,
          `Please greet me and ask what I'd like to work on today.`,
        );

        setContextMessage(parts.join("\n"));
      } catch (e) {
        console.error("Failed to build context:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!contextMessage) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: "#0a0a0a" }}>
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-purple-500"
              style={{ animation: "bounce 1.2s ease-in-out 0.2s infinite" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <AgentChat
      agentName="coach_assistant"
      title="AI Coach Assistant"
      subtitle="Your personal training companion — ask about drills, technique, assignments, and more"
      initialContextMessage={contextMessage}
      accentColor="#8b3dff"
    />
  );
}